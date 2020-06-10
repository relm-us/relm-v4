import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { stateToObject } from './state_to_object.js'
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
    this.tobjects = {}
    
    // Permanent Y document: holds game object state & everything that stays in each relm
    this.ydoc = new Y.Doc()
    this.invitations = this.ydoc.getMap('invitations')
    this.yobjects = this.ydoc.getArray('objects')

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
      this.yobjects.observeDeep((events, t) => {
        this.onGoalsChanged(events)
      })
      
      
      console.log('Opening local database...', cfg.ROOM, params)
      try {
        this.idbProvider = new IndexeddbPersistence(cfg.ROOM, this.ydoc)
        await this.idbProvider.whenSynced
      } catch (err) {
        console.warn("Unable to open indexeddb:", err)
      }

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
    
    // /**
    //  * Create a Y.Map that has been added to either the `tobjects` or `yobjects` lists
    //  * 
    //  * @param {boolean} transient - true if the Y.Map should be added to the transient `tobjects` list
    //  */
    // createTrackedYMap(transient = false) {
    //   const map = new Y.Map()
    //   (transient ? this.tobjects : this.yobjects).insert(0, [map])
    //   return map
    // },
    
    create({ type, uuid = null, goals = {}, transient = false }) {
      console.log('first creation', type, uuid, goals, transient)
      if (transient) {
        this.tobjects[uuid] = state
        this.wsProvider.awareness.setLocalStateField(uuid, state)
      } else {
        const map = new Y.Map()
        // const goalGroup = GoalGroup(uuid, type, map)
        // goalGroup.initializeGoals(goals)
        this.yobjects.insert(0, [map])
      }
    },

    remove(uuid) {
      this.entitiesMap.delete(uuid)
    },
    
    setPermanent(entity) {
      const goalsState = entity.goalsToJSON()
      this.setPermanentState(goalsState)
    },
    
    setPermanentState(state) {
      const type = state['@type']
      if (!type) {
        console.error("Can't set entity goals: @type not set", state)
      }
      
      const uuid = state['@id']
      if (!uuid) {
        console.error("Can't set entity goals: @id not set", state)
      }
      
      this.ydoc.transact((_transaction) => {
        let ymap
        if (uuid in this.objects) {
          ymap = this.objects[uuid]
        } else {
          ymap = new Y.Map()
          this.objects[uuid] = ymap
          this.yobjects.insert(0, ymap)
        }
        
        // const entityMap = this.entitiesMap.get(uuid)
        // entityMap.set('@type', goalsState['@type'])
        // console.log('setPermanentState', goalsState, entityMap.toJSON())
        for (let [key, value] of Object.entries(state)) {
          if (key.slice(0, 1) === '@') {
            ymap.set(key, value)
          } else {
            let ymap2
            if (key)
            this.setGoalPermanent(entityMap, goalName, goal)
          }
        }
        console.log('setPermanentState after', entityMap.toJSON())
      })
    },
    
    setTransient(entity) {
      const uuid = entity.uuid
      const type = entity.type
      if (!type) {
        console.error("Can't set entity goals on network: entity.type not set", entity)
        throw Error('stop')
      }
      const goalsState = entity.goalsToJSON()
      this.setTransientState(uuid, goalsState)
    },
    
    setTransientState(uuid, goalsState, due = Date.now()) {
      this.wsProvider.awareness.setLocalStateField(uuid, goalsState)
    },
    
    setGoalPermanent(entityMap, goalName, goalState) {
    // console.log('setGoalPermanent', entityMap, goalName, goalState)
      let stateMap
      if (!entityMap.has(goalName)) {
        stateMap = new Y.Map()
        entityMap.set(goalName, stateMap)
        // console.log('stateMap new', stateMap)
      } else {
        stateMap = entityMap.get(goalName)
        // console.log('stateMap exists', stateMap)
      }
      // stateMap.set('@due', due)
      // console.log('setGoalPermanent', goalName, state)
      for (let [key, value] of Object.entries(goalState)) {
        // if (!stateMap.set) {
        //   console.log('stateMap', stateMap)
        // }
        stateMap.set(key, value)
      }
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
              console.log('awareness add', uuid, state)
              this.emit('add', uuid, state)
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
          console.log('len-zero', event.changes, event)
          event.changes.keys.forEach(({ action }, uuid) => {
            // console.log(this.entitiesMap, uuid)
            const goalState = this.entitiesMap.get(uuid).toJSON()
            if (action === 'add') {
              console.log('goal added', uuid, goalState)
              this.emit('add', uuid, goalState)
            } else if (action === 'delete') {
              console.log('goal deleted', uuid)
              this.emit('remove', uuid)
            } else if (action === 'update') {
              console.log('goal updated', uuid)
              this.emit(`update-${uuid}`, state)
            } else {
              console.warn('action not handled', action, uuid)
            }
          })
        } else {
          console.log('event', event.path, event, event.changes, event.changes.keys)
        }
      }
    }

  }
})

export { Network }