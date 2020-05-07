import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

import { stateToObject } from './state_to_object.js'
import config from './config.js'
import { uuidv4 } from './util.js'

const Network = stampit(EventEmittable, {
  props: {
    ydoc: new Y.Doc(),
    entityStates: null,
    invitations: null,
    provider: null,
    connected: false,
    // authorized: false,
  },

  init() {
    window.network = this
    
    this.clientIdsToEntityState = {}
    this.clientIdsConnected = new Set()
    this.clientIdsAdded = new Set()
    
    this.entityStates = this.ydoc.getMap('entities')
    this.invitations = this.ydoc.getMap('invitations')
  },

  methods: {
    /**
     * Adds a stateful entity to the network, to be synced with all clients.
     * 
     * @param {Entity} entity 
     */
    setEntity(entity) {
      const state = stateToObject(entity.type, entity.state)
      this.setState(entity.uuid, state)
    },
    
    getState(uuid) {
      return this.entityStates.get(uuid)
    },
    
    setState(uuid, state) {
      if (state) {
        this.entityStates.set(uuid || uuidv4(), state)
      } else {
        console.warn('attempted to add null state to network (not added)', state)
      }
    },

    removeEntity(uuid) {
      this.entityStates.delete(uuid)
    },

    connect(params = {}) {
      const cfg = config(window.location)
      console.log('trying to connect ws to', cfg.SERVER_YJS_URL, cfg.ROOM, params)

      this.provider = new WebsocketProvider(cfg.SERVER_YJS_URL, cfg.ROOM, this.ydoc, { params })
      this.provider.on('status', (status) => {
        if (status.status === 'connected') {
          this.connected = true
        } else if (status.status === 'disconnected') {
          this.connected = false
        }
      })
      this.provider.awareness.on('change', ({ added, updated, removed}, _conn) => {
        this.onAwarenessChanged(added)
        this.onAwarenessChanged(updated)
        this.onAwarenessRemoved(removed)
      })
      
      this.observeEntityStates()
    },

    onAwarenessChanged(added) {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of added) {
        if (clientId === this.ydoc.clientID) { continue }
        const keyedState = this.provider.awareness.getStates().get(clientId)
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
        // FIXME: can't get state since it is removed by yjs;
        // see https://discuss.yjs.dev/t/should-awareness-emit-change-before-removing-state
        // const state = this.provider.awareness.getStates().get(clientId)
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
    }

  }
})

export { Network }