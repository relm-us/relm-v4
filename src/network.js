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
    this.goalsMap = this.ydoc.getMap('goals')
  },

  methods: {
    isReady() {
      return !!this.idbProvider && !!this.wsProvider
    },

    /**
     * Adds a stateful entity to the network, to be synced with all clients.
     * 
     * @param {Entity} entity 
     */
    setEntity(entity, debug = false) {
      const state = stateToObject(entity.type, entity.state)
      if (debug) {
        console.log('setEntity', entity, state)
      }
      this.setState(entity.uuid, state)
    },
    
    getState(uuid) {
      return this.entityStates.get(uuid)
    },
    
    setState(uuid, state) {
      if (state) {
        console.log('setting state', uuid, state)
        this.entityStates.set(uuid, state)
      } else {
        console.warn('attempted to add null state to network (not added)', state)
      }
    },
    
    setGoal(uuid, property, key, value) {
      let entityMap
      if (!this.goalsMap.has(uuid)) {
        entityMap = new Y.Map()
        this.goalsMap.set(uuid, entityMap)
      } else {
        entityMap = this.goalsMap.get(uuid)
      }
      
      let propertyMap
      if (!entityMap.has(property)) {
        propertyMap = new Y.Map()
        entityMap.set(property, propertyMap)
      } else {
        propertyMap = entityMap.get(property)
      }
      
      propertyMap.set(key, value)
    },

    removeEntity(uuid) {
      this.entityStates.delete(uuid)
    },

    async connect(params = {}) {
      const cfg = config(window.location)
      
      // Start observing before opening connections so that we get a replay of the world state
      this.observeEntityStates()
      this.observeGoals()
      
      console.log('Opening local database...', cfg.ROOM, params)
      this.idbProvider = new IndexeddbPersistence(cfg.ROOM, this.ydoc)
      await this.idbProvider.whenSynced
      
      if (false) {

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
      
      }
    },

    onAwarenessChanged(added) {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of added) {
        if (clientId === this.ydoc.clientID) { continue }
        const keyedState = this.wsProvider.awareness.getStates().get(clientId)
        if (keyedState) {
          this.clientIdsToEntityState[clientId] = keyedState
          for (let uuid in keyedState) {
            const state = keyedState[uuid]
            if (!this.clientIdsAdded.has(uuid)) {
              console.log('emit add', uuid, state)
              this.emit('add', uuid, state)
              this.clientIdsAdded.add(uuid)
              this.clientIdsConnected.add(uuid)
            } else if (!this.clientIdsConnected.has(uuid)) {
              this.emit('connect', uuid, state)
              this.clientIdsConnected.add(uuid)
            } else {
              this.emit('update', uuid, state)
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

    observeEntityStates() {
      this.entityStates.observeDeep((events, t) => {
        for (let event of events) {
          if (event.path.length === 0) {
            event.changes.keys.forEach(({ action }, uuid) => {
              const state = this.entityStates.get(uuid)
              if (action === 'add') {
                console.log('entity added', uuid, state)
                this.emit('add', uuid, state)
              } else if (action === 'delete') {
                console.log('entity deleted', uuid)
                this.emit('remove', uuid)
              } else if (action === 'update') {
                console.log('entity updated', uuid)
                this.emit(`update-${uuid}`, state)
              } else {
                console.warn('action not handled', action, uuid)
              }
            })
          }
        }
      })
    },

    observeGoals() {
      this.goalsMap.observeDeep((events, t) => {
        for (let event of events) {
          if (event.path.length === 0) {
            event.changes.keys.forEach(({ action }, uuid) => {
              const state = this.entityStates.get(uuid)
              if (action === 'add') {
                console.log('goal added', uuid, state)
                this.emit('add-goal', uuid, state)
              } else if (action === 'delete') {
                console.log('goal deleted', uuid)
                this.emit('remove-goal', uuid)
              } else if (action === 'update') {
                console.log('goal updated', uuid)
                this.emit(`update-goal-${uuid}`, state)
              } else {
                console.warn('action not handled', action, uuid)
              }
            })
          }
        }
      })
      
    }

  }
})

export { Network }