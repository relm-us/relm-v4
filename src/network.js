import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

import { stateToObject } from './state_to_object.js'
import config from './config.js'

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
    
    this.ydoc = new Y.Doc()

    this.clientIdsToEntityState = {}
    this.clientIdsConnected = new Set()
    this.clientIdsAdded = new Set()
    
    this.entityStates = this.ydoc.getMap('entities')
    this.invitations = this.ydoc.getMap('invitations')
    
    // For now, keep goalnet state separate
    this.entitiesMap = this.ydoc.getMap('goals')
  },
  
  methods: {
    isReady() {
      return !!this.idbProvider && !!this.wsProvider
    },
    
    async connect(params = {}) {
      const cfg = config(window.location)
      
      // Start observing before opening connections so that we get a replay of the world state
      // this.observeEntityStates()
      this.entitiesMap.observeDeep((events, t) => {
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
      
      this.wsProvider.on('status', (status) => {
        if (status.status === 'connected') {
          this.connected = true
        } else if (status.status === 'disconnected') {
          this.connected = false
        }
      })
      this.wsProvider.awareness.on('change', ({ added, updated, removed}, _conn) => {
        this.onAwarenessChanged(added)
        this.onAwarenessChanged(updated)
        this.onAwarenessRemoved(removed)
      })
    },
    

    remove(uuid) {
      this.entitiesMap.delete(uuid)
    },
    
    setPermanent(entity, due = Date.now()) {
      const uuid = entity.uuid
      const type = entity.type
      if (!type) {
        console.error("Can't set entity goals on network: entity.type not set", entity)
      }
      this.ydoc.transact((_transaction) => {
        if (!this.entitiesMap.has(uuid)) {
          this.entitiesMap.set(uuid, new Y.Map())
        }
        const entityMap = this.entitiesMap.get(uuid)
        entityMap.set('@type', entity.type)
        for (let [goalName, goal] of Object.entries(entity.goals)) {
          this.setGoalPermanent(entityMap, goalName, goal.get(), due)
        }
      })
    },
    
    setTransient(entity, due = Date.now()) {
      const uuid = entity.uuid
      const type = entity.type
      if (!type) {
        console.error("Can't set entity goals on network: entity.type not set", entity)
        throw Error('stop')
      }
      // debugger
      const goalsState = entity.goalsToJSON()
      // console.log('setTransient', uuid, goalsState)
      this.wsProvider.awareness.setLocalStateField(entity.uuid, goalsState)
    },
    
    setGoalPermanent(entityMap, goalName, state, due = Date.now()) {
      let stateMap
      if (!entityMap.has(goalName)) {
        stateMap = new Y.Map()
        entityMap.set(goalName, stateMap)
      } else {
        stateMap = entityMap.get(goalName)
      }
      stateMap.set('@due', due)
      // console.log('setGoalPermanent', goalName, state)
      for (let [key, value] of Object.entries(state)) {
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
      for (let event of events) {
        if (event.path.length === 0) {
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
        }
      }
    }

  }
})

export { Network }