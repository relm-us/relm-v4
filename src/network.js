import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { GoalGroup } from './goals/goal_group.js'
import { Typed } from './typed.js'
import { uuidv4 } from './util.js'
import { config } from './config.js'
import { installGetSetInterceptors } from './get_set_interceptors.js'


const Document = stampit({
  init({ emitter }) {
    this.emitter = emitter
    this.doc = new Y.Doc()
    this.objects = this.doc.getMap('objects')
    this.provider = null
    
    this.addedObjects = {}

    this.objects.observe((event) => {
      event.keysChanged.forEach(key => {
        if (this.objects.has(key)) {
          this._addObject(key)
        } else {
          this._removeObject(key)
        }
      })
    })
  },
 
  methods: {
    _addObject(key) {
      const added = this.objects.get(key)
      this.addedObjects[key] = added
      this.emitter.emit('add', added, false)
    },
    
    _removeObject(key) {
      const added = this.addedObjects[key]
      this.emitter.emit('remove', key, added)
      delete this.addedObjects[key]
    },

    _connectWebsocketProvider({ serverUrl, room, params = {}, onSync }) {
      console.log(`Opening websocket to room '${room}'`, serverUrl, params)
      this.provider = new WebsocketProvider(serverUrl, room, this.doc, { params })
      if (onSync) { this.provider.on('sync', onSync) }
      
      return this.provider 
    },
    
    connect({ serverUrl, room, params, onSync }) {
      this._connectWebsocketProvider({ serverUrl, room, params, onSync })
    },
    
    create({ type, uuid = uuidv4(), goals = {} }) {
      const Type = Typed.getType(type)
      const ymap = new Y.Map()
      this.doc.transact(() => {
        this.objects.set(uuid, ymap)
        GoalGroup.goalsDescToYMap({
          type,
          uuid,
          ymap,
          goalDefinitions: Type.goalDefinitions,
          goalsDesc: goals
        })
      })
      console.log('created', type, uuid, 'goals', goals, 'definitions', Type.goalDefinitions, 'ymap', ymap.toJSON())
    },
    
    remove(uuid) {
      this.objects.delete(uuid)
    },


  }
})

const TransientDocument = stampit(Document, {
  init() {
    this._bufferedAwarenessState = {}
    this.counter = 0
  },

  methods: {
    installInterceptors(entity) {
      ['p', 'r'].forEach(goalAbbrev => {
        if (entity.goals.has(goalAbbrev)) {
          installGetSetInterceptors(entity.goals.get(goalAbbrev)._map, ['@due', 'x', 'y', 'z'], {
            has: (key) => { return this.hasState(entity.uuid, goalAbbrev, key) },
            get: (key) => { return this.getState(entity.uuid, goalAbbrev, key) },
            set: (key, value) => {
              this.setState(entity.uuid, goalAbbrev, key, value)
              entity.goals.get(goalAbbrev).achieved = false
            },
            toJSON: (originalJson) => {
              const state = this.getAllState(entity.uuid, goalAbbrev)
              const json = Object.assign(originalJson, state)
              // console.log('mouse json', json)
              return json
            }
          })
        }
      })
    },
    
    _addObject(key) {
      const added = this.objects.get(key)
      this.addedObjects[key] = added
      this.emitter.emit('add', added, true)
    },
    
    _ensureStatePath(uuid, goalAbbrev, key) {
      if (!(uuid in this._bufferedAwarenessState)) {
        this._bufferedAwarenessState[uuid] = {
          [goalAbbrev]: {}
        }
      }
      if (!(goalAbbrev in this._bufferedAwarenessState[uuid])) {
        this._bufferedAwarenessState[uuid][goalAbbrev] = {}
      }
      if (key !== undefined && !(key in this._bufferedAwarenessState[uuid][goalAbbrev])) {
        this._bufferedAwarenessState[uuid][goalAbbrev][key] = 0.0
      }
    },
    
    connect({ serverUrl, room, params, onSync }) {
      this._connectWebsocketProvider({ serverUrl, room, params, onSync })
      this.provider.awareness.on('update', this.receiveState.bind(this))
    },
    
    hasState(uuid, goalAbbrev, key) {
      this._ensureStatePath(uuid, goalAbbrev, key)
      return key in this._bufferedAwarenessState[uuid][goalAbbrev]
    },

    getState(uuid, goalAbbrev, key) {
      this._ensureStatePath(uuid, goalAbbrev, key)
      return this._bufferedAwarenessState[uuid][goalAbbrev][key]
    },
    
    getAllState(uuid, goalAbbrev) {
      this._ensureStatePath(uuid, goalAbbrev)
      return this._bufferedAwarenessState[uuid][goalAbbrev]
    },

    setState(uuid, goalAbbrev, key, value) {
      this._ensureStatePath(uuid, goalAbbrev)
      this._bufferedAwarenessState[uuid][goalAbbrev][key] = value
    },

    sendState() {
      // if (this.counter++ % 50 === 0)
      //   console.log('sendState', JSON.stringify(this._bufferedAwarenessState))
      this.provider.awareness.setLocalState(this._bufferedAwarenessState)
    },
    
    receiveState({ added, updated, removed }) {
      const states = this.provider.awareness.getStates()
      for (const clientID of updated) {
        const state = states.get(clientID)
        for (const [uuid, valuesObject] of Object.entries(state)) {
          this._bufferedAwarenessState[uuid] = valuesObject
          // console.log('receive state', uuid, valuesObject)
          this.emitter.emit('transient-receive', uuid, valuesObject)
        }
      } 
    }
  }
})


/**
 * The Network object is an adapter between Yjs and the rest of Relm. It's responsible for setting values that
 * will propagate to other peers / servers, and conversely, forwarding events that should trigger game state
 * changes such as adding an object, or updating a property on an already existing object.
 */
const Network = stampit(EventEmittable, {
  init() {
    window.network = this
    
    // Transient document: holds things like player state and mouse pointer state
    this.transients = TransientDocument({ emitter: this })
    
    // Permanent Y document: holds game object state & everything that stays in each relm
    this.permanents = Document({ emitter: this })
  },
  
  methods: {
    async connect({ params = {}, onTransientsSynced }) {
      const cfg = config(window.location)
      const serverUrl = cfg.SERVER_YJS_URL
      
      this.transients.connect({
        serverUrl,
        room: cfg.ROOM + '.t',
        params,
        onSync: onTransientsSynced,
      })
      
      this.permanents.connect({
        serverUrl,
        room: cfg.ROOM,
        params
      })
    },
    
    async connectToLocal(ydoc, room) {
      console.log('Opening local database...', room)
      try {
        const provider = new IndexeddbPersistence(room, ydoc)
        await provider.whenSynced
      } catch (err) {
        console.warn("Unable to open indexeddb:", err)
      }
    },
  }
})

const network = window.network = Network()

export {
  Network,
  network,
}
