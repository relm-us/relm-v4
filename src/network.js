import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { GoalGroup } from './goals/goal_group.js'
import { Typed } from './typed.js'
import { uuidv4 } from './util.js'
import { config } from './config.js'


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
          const added = this.objects.get(key)
          this.addedObjects[key] = added
          emitter.emit('add', added)
        } else {
          const added = this.addedObjects[key]
          emitter.emit('remove', key, added)
          delete this.addedObjects[key]
        }
      })
    })
  },
 
  methods: {
    connectWebsocketProvider({ serverUrl, room, params = {}, onSync }) {
      console.log(`Opening websocket to room '${room}'`, serverUrl, params)
      this.provider = new WebsocketProvider(serverUrl, room, this.doc, { params })
      if (onSync) { this.provider.on('sync', onSync) }
      return this.provider 
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
    this.transients = Document({ emitter: this })
    
    // Permanent Y document: holds game object state & everything that stays in each relm
    this.permanents = Document({ emitter: this })
  },
  
  methods: {
    async connect({ params = {}, onTransientsSynced }) {
      const cfg = config(window.location)
      const serverUrl = cfg.SERVER_YJS_URL
      
      this.transients.connectWebsocketProvider({
        serverUrl,
        room: cfg.ROOM + '.t',
        params,
        onSync: onTransientsSynced,
      })
      
      this.permanents.connectWebsocketProvider({
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
