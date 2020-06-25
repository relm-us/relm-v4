import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { ServerDate } from './lib/ServerDate.js'
import { GoalGroup } from './goals/goal_group.js'
import { Typed } from './typed.js'
import { uuidv4 } from './util.js'
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
    
    create({ type, uuid = uuidv4(), goals = {}, after }) {
      this.emitter._afterCreateCallbacks[uuid] = after
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
      // console.log('created', type, uuid, 'goals', goals, 'definitions', Type.goalDefinitions, 'ymap', ymap.toJSON())
    },

    fromJSON(json, instantaneous = false) {
      const uuid = json['@id']
      if (!uuid) { throw Error(`Can't import json, no '@id'`) }
      const type = json['@type']
      if (!type) { throw Error(`Can't import json, no '@type'`)}
      
      this.doc.transact(() => {
        let ymap
        if (this.objects.has(uuid)) {
          ymap = this.objects.get(uuid)
        } else {
          ymap = new Y.Map()
          this.objects.set(uuid, ymap)
        }
        
        ymap.set('@id', uuid)
        ymap.set('@type', type)
        
        for (const [goalAbbrev, goalState] of Object.entries(json)) {
          if (goalAbbrev.slice(0,1) !== '@') {
            let ymapState
            if (ymap.has(goalAbbrev)) {
              ymapState = ymap.get(goalAbbrev)
            } else {
              ymapState = new Y.Map()
              ymap.set(goalAbbrev, ymapState)
            }
            goalState['@due'] = instantaneous ? 0 : ServerDate.now() + 5000
            for (const [k, v] of Object.entries(goalState)) {
              ymapState.set(k, v)
            }
          }
        }
      })
    },
    
    remove(uuid) {
      this.objects.delete(uuid)
    },


  }
})

const TransientDocument = stampit(Document, {
  init() {
    this._cachedAwarenessState = {}
    // Set changed state to true so that initial values are broadcast
    this._cachedAwarenessStateChanged = true
    this.counter = 0
  },

  methods: {
    installInterceptors(entity, abbrevs = ['p', 'r', 'spd', 'ans', 'vid']) {
      this._cachedAwarenessState[entity.uuid] = {}
      abbrevs.forEach(goalAbbrev => {
        if (entity.goals.has(goalAbbrev)) {
          const internalMap = entity.goals.get(goalAbbrev)._map
          const keys = Array.from(internalMap.keys())
          // Set default values
          this._cachedAwarenessState[entity.uuid][goalAbbrev] = internalMap.toJSON()
          installGetSetInterceptors(internalMap, keys, {
            has: (key) => { return this.hasState(entity.uuid, goalAbbrev, key) },
            get: (key) => { return this.getState(entity.uuid, goalAbbrev, key) },
            set: (key, value) => {
              if (this.setState(entity.uuid, goalAbbrev, key, value)) {
                entity.goals.get(goalAbbrev).achieved = false
              }
            },
            toJSON: (originalJson) => {
              const state = this.getAllState(entity.uuid, goalAbbrev) || {}
              const json = Object.assign(originalJson, state)
              return json
            }
          })
        }
      })
    },
    
    _addObject(key) {
      const added = this.objects.get(key)
      this.addedObjects[key] = added
      // Make sure to send 'true' for isTransient bool
      this.emitter.emit('add', added, true)
    },
    
    _ensureStatePath(uuid, goalAbbrev, key) {
      if (!(uuid in this._cachedAwarenessState)) {
        this._cachedAwarenessState[uuid] = {
          [goalAbbrev]: {}
        }
      }
      if (!(goalAbbrev in this._cachedAwarenessState[uuid])) {
        this._cachedAwarenessState[uuid][goalAbbrev] = {}
      }
    },
    
    connect({ serverUrl, room, params, onSync }) {
      this._connectWebsocketProvider({ serverUrl, room, params, onSync })
      this.provider.awareness.on('update', this.receiveState.bind(this))
    },
    
    hasState(uuid, goalAbbrev, key) {
      try {
        return key in this._cachedAwarenessState[uuid][goalAbbrev]
      } catch (e) {
        return false
      }
    },

    getState(uuid, goalAbbrev, key) {
      try {
        return this._cachedAwarenessState[uuid][goalAbbrev][key]
      } catch (e) {}
    },
    
    getAllState(uuid, goalAbbrev) {
      try {
        return this._cachedAwarenessState[uuid][goalAbbrev]
      } catch (e) {}
    },

    setState(uuid, goalAbbrev, key, value) {
      if (this._cachedAwarenessState[uuid][goalAbbrev][key] !== value) {
        this._cachedAwarenessState[uuid][goalAbbrev][key] = value
        this._cachedAwarenessStateChanged = true
        return true
      } else {
        return false
      }
    },

    sendState(uuids) {
      if (!this.provider) return
      if (this._cachedAwarenessStateChanged) {
        this._cachedAwarenessStateChanged = false
        uuids.forEach(uuid => {
          if (this._cachedAwarenessState[uuid]) {
            this.provider.awareness.setLocalStateField(uuid, this._cachedAwarenessState[uuid])
          }
        })
      }
    },
    
    receiveState({ added, updated, removed }) {
      const states = this.provider.awareness.getStates()
      this.counter++
      for (const clientID of updated) {
        const state = states.get(clientID)
        for (const [uuid, valuesObject] of Object.entries(state)) {
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
    
    this._afterCreateCallbacks = {}
  },
  
  methods: {
    async connect({ params = {}, serverUrl, room, connectTransients, onTransientsSynced }) {
      if (connectTransients) {
        this.transients.connect({
          serverUrl,
          room: room + '.t',
          params,
          onSync: onTransientsSynced,
        })
      } else {
        onTransientsSynced()
      }
      
      this.permanents.connect({
        serverUrl,
        room,
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
    
    afterAdd(entity) {
      const callback = this._afterCreateCallbacks[entity.uuid]
      if (callback) {
        callback(entity)
      }
    }
  }
})

const network = window.network = Network()

export {
  Network,
  network,
}
