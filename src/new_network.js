import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const Y_URL = 'wss://y.relm.us'
const Y_ROOM = 'ayanarra'

const Network = stampit(EventEmittable, {
  props: {
    ydoc: new Y.Doc(),
    entityStates: null,
    provider: null,
  },

  init() {
    window.network = this
    
    this.clientIdsToEntityState = {}
    this.clientIdsConnected = new Set()
    this.clientIdsAdded = new Set()
    
    this.entityStates = this.ydoc.getMap('entities')
    
  },

  methods: {
    connect() {
      this.provider = new WebsocketProvider(Y_URL, Y_ROOM, this.ydoc)
      this.provider.awareness.on('change', ({ added, updated, removed}, _conn) => {
        this.onAwarenessChanged(added)
        this.onAwarenessChanged(updated)
        this.onAwarenessRemoved(removed)
      })
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
    }
  }
})

export { Network }