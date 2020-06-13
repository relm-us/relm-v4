import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import * as R from './rmap.js'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { GoalGroup } from './goals/goal_group.js'
import { uuidv4 } from './util.js'
import { config } from './config.js'


const Document = stampit({
  init({ emitter }) {
    this.emitter = emitter
    this.doc = new Y.Doc()
    this.objects = this.doc.getMap('objects')
    
    this.addedObjects = {}

    this.objects.observe((event) => {
      event.keysChanged.forEach(key => {
        if (this.objects.has(key)) {
          const added = this.objects.get(key)
          this.addedObjects[key] = added
          emitter.emit('add', added)
        } else {
          const added = this.addedObjects[key]
          emitter.emit('remove', added)
          delete this.addedObjects[key]
        }
      })
    })
  },
 
  methods: {
    create({ type, uuid = uuidv4(), goals = {} }) {
      const ymap = new Y.Map()
      this.doc.transact(() => {
        this.objects.set(uuid, ymap)
        GoalGroup.goalsDescToYMap({ type, uuid, ymap, goals })
      })
      console.log('created', type, uuid, 'goals', goals, 'ymap', ymap.toJSON())
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
  props: {
    ydoc: null,
    entityStates: null,
    invitations: null,
    wsProvider: null,
    idbProvider: null,
    connected: false,
  },

  init() {
    window.network = this
    
    // Transient document: holds things like player state and mouse pointer state
    this.transients = Document({ emitter: this })
    
    // Permanent Y document: holds game object state & everything that stays in each relm
    this.permanents = Document({ emitter: this })
    
    // Store connections to local or remote servers
    this.providers = []
  },
  
  methods: {
    async connect(params = {}) {
      const cfg = config(window.location)
      const serverUrl = cfg.SERVER_YJS_URL
      
      {
        const ydoc = this.permanents.doc
        const room = cfg.ROOM
        // await this.connectToLocal(ydoc, room)
        await this.connectToServer(ydoc, serverUrl, room, params)
      }
    },
    
    async connectToLocal(ydoc, room) {
      console.log('Opening local database...', room)
      try {
        const provider = new IndexeddbPersistence(room, ydoc)
        await provider.whenSynced
        this.providers.push(provider)
      } catch (err) {
        console.warn("Unable to open indexeddb:", err)
      }
    },
    
    async connectToServer(ydoc, server, room, params) {
      console.log('Opening remote websocket...', server, room, params)
      const provider = new WebsocketProvider(server, room, ydoc, { params })
      this.providers.push(provider)
    },
  }
})

const network = window.network = Network()

export {
  Network,
  network,
}
