import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

import { stateToObject } from './state_to_object.js'
import config from './config.js'

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
    addEntity(entity) {
      if (entity.state) {
        this.entityStates.set(entity.uuid, stateToObject(entity.uuid, entity.state))
      } else {
        console.warn('entity added to the network must have state (not added)', entity)
      }
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
          for (let key in keyedState) {
            const state = keyedState[key]
            if (!this.clientIdsAdded.has(state.uuid)) {
              console.log('emit add', key, state)
              this.emit('add', key, state)
              this.clientIdsAdded.add(state.uuid)
              this.clientIdsConnected.add(state.uuid)
            } else if (!this.clientIdsConnected.has(state.uuid)) {
              this.emit('connect', key, state)
              this.clientIdsConnected.add(state.uuid)
            } else {
              this.emit('update', key, state)
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
          for (let key in keyedState) {
            const state = keyedState[key]
            this.emit('disconnect', key, state)
            this.clientIdsConnected.delete(state.uuid)
          }
        } else {
          console.warn('Unable to accept disconnect', clientId, state)
        }
      }
    },

    observeEntityStates() {
      this.state.entityStates.observeDeep((events, t) => {
        for (let event of events) {
          if (event.path.length === 0) {
            event.changes.keys.forEach(({ action }, uuid) => {
              const entityState = this.state.entityStates.get(uuid)
              if (action === 'add') {
                // this.emit('add', )
                console.log('entity added', entityState)
              } else if (action === 'delete') {
                // this.removePlayerEvent(playerState)
                console.log('entity deleted', entityState)
              }
            })
          }
          if (event.path.length > 0) {
            const uuid = event.path[0]
            const entityState = this.state.entityStates.get(uuid)
            // this.updatePlayerEvent(playerState)
            console.log('entity updated', entityState)
          }
        }
      })      
    }
  }
})

export { Network }