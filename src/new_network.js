import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const Y_URL = 'ws://ayanarra.com:1235'
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
    
    this.provider = new WebsocketProvider(Y_URL, Y_ROOM, this.ydoc)
    this.entityStates = this.ydoc.getMap('entities')
    
    this.provider.awareness.on('change', ({ added, updated, removed}, _conn) => {
      this.onAwarenessChanged(added)
      this.onAwarenessChanged(updated)
      this.onAwarenessRemoved(removed)
    })
  },

  methods: {
    onAwarenessChanged(added) {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of added) {
        if (clientId === this.ydoc.clientID) { continue }
        const state = this.provider.awareness.getStates().get(clientId)
        if (state) {
          this.clientIdsToEntityState[clientId] = state
          if (!this.clientIdsAdded.has(clientId) && !this.clientIdsConnected.has(clientId)) {
            for (let key in state) {
              this.emit('add', key, state[key])
            }
            this.clientIdsAdded.add(clientId)
            this.clientIdsConnected.add(clientId)
          } else if (!this.clientIdsConnected) {
            for (let key in state) {
              this.emit('connect', key, state[key])
            }
            this.clientIdsConnected.add(clientId)
          } else {
            for (let key in state) {
              this.emit('update', key, state[key])
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
        const state = this.clientIdsToEntityState[clientId]
        if (state) {
          for (let key in state) {
            this.emit('disconnect', key, state[key])
          }
          this.clientIdsConnected.delete(clientId)
        } else {
          console.warn('Unable to accept disconnect', clientId, state)
        }
      }
    }
  }
})

export { Network }