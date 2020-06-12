import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import * as R from './rmap.js'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { GoalGroup } from './goals/goal_group.js'
import { uuidv4 } from './util.js'
import config from './config.js'



/**
 * The Network object is an adapter between Yjs and the rest of Relm. It's responsible for setting values that
 * will propagate to other peers / servers, and conversely, forwarding events that should trigger game state
 * changes such as adding an object, or updating a property on an already existing object.
 * 
 * The `yobjects` part of the ydoc is an array of maps of maps:
 * [
 *   {
 *      "@id": "ca1901f9-853d-4570-a6af-9d810fa37b9d",
 *      "@type": "decoration",
 *      "p": { "x": 0, "y": 0, "z": 0, "@due": 1234567890 },
 *      "speed": { "value": 1.0, "@due": 1234567890 }
 *   },
 *   ...
 * ]
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
    this.tdoc = new Y.Doc()
    this.transients = this.ydoc.getArray('transients')
    
    // Permanent Y document: holds game object state & everything that stays in each relm
    this.ydoc = new Y.Doc()
    this.invitations = this.ydoc.getMap('invitations')
    this.objects = this.ydoc.getArray('objects')

    this.clientIdsToEntityState = {}
    this.clientIdsConnected = new Set()
    this.clientIdsAdded = new Set()
  },
  
  methods: {
    isReady() {
      return !!this.idbProvider && !!this.wsProvider
    },
    
    async connect(params = {}) {
      const cfg = config(window.location)
      
      // Start observing before opening connections so that we get a replay of the world state
      // this.observeEntityStates()
      this.objects.observeDeep((events, t) => {
        this.onGoalsChanged(events)
      })
      
      
      /*
      console.log('Opening local database...', cfg.ROOM, params)
      try {
        this.idbProvider = new IndexeddbPersistence(cfg.ROOM, this.ydoc)
        await this.idbProvider.whenSynced
      } catch (err) {
        console.warn("Unable to open indexeddb:", err)
      }
      */

      console.log('Opening remote websocket...', cfg.SERVER_YJS_URL, cfg.ROOM, params)
      this.wsProvider = new WebsocketProvider(cfg.SERVER_YJS_URL, cfg.ROOM, this.ydoc, { params })
      this.wsProvider.awareness.on('update', ({ added, updated, removed}, _conn) => {
        // console.log('awareness change added', added)
        // console.log('awareness change updated', updated)
        // console.log('awareness change removed', removed)
        this.onAwarenessChanged(added)
        this.onAwarenessChanged(updated)
        this.onAwarenessRemoved(removed)
      })
    },
    
    create({ type, uuid = null, goals = {}, transient = false }) {
      const id = uuid || uuidv4()
      if (transient) {
        const stateJson = GoalGroup.goalsDescToJson(type, id, goals)
        this.tobjects[id] = stateJson
        this.wsProvider.awareness.setLocalStateField(id, stateJson)
        console.log('create transient', type, id, stateJson)
      } else {
        const stateMap = GoalGroup.goalsDescToMap(Y.Map, type, id, goals)
        console.log('create permanent-1', type, id, goals, stateMap.toJSON(), stateMap.get('ast').get('url'))
        this.objects.push([stateMap])
        console.log('create permanent-2', type, id, goals, stateMap.toJSON(), stateMap.get('ast').get('url'))
      }
    },

    remove(uuid) {
      this.entitiesMap.delete(uuid)
    },
    
    onAwarenessChanged(added) {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of added) {
        const keyedState = this.wsProvider.awareness.getStates().get(clientId)
        if (keyedState) {
          this.clientIdsToEntityState[clientId] = keyedState
          for (let uuid in keyedState) {
            const state = keyedState[uuid]
            if (!this.clientIdsAdded.has(uuid)) {
              const stateMap = GoalGroup.jsonToMap(R.Map, state)
              console.log('awareness add', uuid, stateMap, state)
              this.emit('add', stateMap)
              this.clientIdsAdded.add(uuid)
              this.clientIdsConnected.add(uuid)
            } else if (!this.clientIdsConnected.has(uuid)) {
              this.emit('connect', uuid, state)
              this.clientIdsConnected.add(uuid)
            } else {
              // console.log('awareness update', uuid, state)
              this.emit(`update-${uuid}`, state)
            }
          }
        } else {
          console.warn('Unable to accept state change', clientId, state)
        }
      }
    },

    onAwarenessRemoved(removed) {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of removed) {
        if (clientId === this.ydoc.clientID) { continue }
        const keyedState = this.clientIdsToEntityState[clientId]
        if (keyedState) {
          for (let uuid in keyedState) {
            const state = keyedState[uuid]
            this.emit('disconnect', uuid, state)
            this.clientIdsConnected.delete(uuid)
          }
        } else {
          console.warn('Unable to accept disconnect', clientId, state)
        }
      }
    },

    onGoalsChanged(events) {
      // console.log('onGoalsChanged', events)
      for (let event of events) {
        if (event.path.length === 0) {
          event.changes.added.forEach((item) => {
            const goalGroupMap = item.content.type
            this.emit('add', goalGroupMap)
          })
          event.changes.deleted.forEach((item) => {
            const goalGroupMap = item.content.type
            this.emit('remove', goalGroupMap)
          })
          // event.changes.keys.forEach(({ action }, uuid) => {
          //   // console.log(this.entitiesMap, uuid)
          //   const goalState = this.entitiesMap.get(uuid).toJSON()
          //   if (action === 'add') {
          //     console.log('goal added', uuid, goalState)
          //     this.emit('add', uuid, goalState)
          //   } else if (action === 'delete') {
          //     console.log('goal deleted', uuid)
          //     this.emit('remove', uuid)
          //   } else if (action === 'update') {
          //     console.log('goal updated', uuid)
          //     this.emit(`update-${uuid}`, state)
          //   } else {
          //     console.warn('action not handled', action, uuid)
          //   }
          // })
        } else {
          console.log('event', event.path, event, event.changes, event.changes.keys)
        }
      }
    }

  }
})

export { Network }