import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

import { uuidv4 } from './util.js'
import { EventEmitter } from './event_emitter.js'
import { playerStateToModel, playerModelToState, playerToState } from './player_model.js'
import { avatarOptionFromPlayerId } from './avatars.js'

// const Y_URL = 'ws://localhost:1235'
const Y_URL = 'ws://ayanarra.com:1235'
const Y_ROOM = 'ayanarra'

let playerId

class Network extends EventEmitter {
  constructor() {
    super()

    window.ynetwork = this
    this.doc = window.doc = new Y.Doc()
    this.clientId = this.doc.clientID // note difference in capitalization
    this.state = window.ystate = {
      global: this.doc.getMap('global'),
      // playerStates are updated infrequently (e.g. avatar, last seen position),
      // while awareness info for players is updated frequently (e.g. position, mouse)
      playerStates: this.doc.getMap('players'),
      objectStates: this.doc.getMap('objects'),
    }

    /**
     * @type {Map<number, PlayerState>} Map of clients we've seen so far
     */
    this.addedPlayers = {}

    this.registerEvents()
  }

  connect () {
    this.wsProvider = new WebsocketProvider(Y_URL, Y_ROOM, this.doc)
    this.wsProvider.awareness.on('change', ({ added, removed, updated }, conn) => {
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of added) {
        const playerState = this.wsProvider.awareness.getStates().get(clientId)
        if (playerState && playerState.id) {
          if (clientId in this.addedPlayers) {
            this.connectPlayerEvent(clientId, playerState)
          } else {
            this.addConnectPlayerEvent(clientId, playerState)
          }
          this.addedPlayers[clientId] = playerState
          console.log('User connected:', clientId, playerState)
        } else {
          console.warn('Unable to accept connection', clientId, playerState)
        }
      }

      // Update connecting clients from the this.clients map. Emit `disconnectPlayer`.
      for (let clientId of updated) {
        const playerState = this.wsProvider.awareness.getStates().get(clientId)
        if (playerState && playerState.id) {
          this.updatePlayerEvent(playerState)
          console.log('User updated:', clientId, playerState)
          delete this.addedPlayers[clientId]
        } else {
          console.warn('Unable to accept update', clientId, playerState)
        }
      }

      // Remove connecting clients from the this.clients map. Emit `disconnectPlayer`.
      // Note: `clientId` is the yjs-assigned integer for each client.
      for (let clientId of removed) {
        const playerState = this.wsProvider.awareness.getStates().get(clientId)
        if (playerState && playerState.id) {
          this.disconnectPlayerEvent(clientId, playerState)
          console.log('User disconnected:', clientId, playerState)
          delete this.addedPlayers[clientId]
        } else {
          console.warn('Unable to accept disconnection', clientId, playerState)
        }
      }
    })
  }

  // Callback `added` is called once per player that joins the world
  registerEvents() {
    this.state.playerStates.observeDeep((events, t) => {
      for (let event of events) {
        if (event.path.length === 0) {
          event.changes.keys.forEach(({ action }, playerId) => {
            const playerState = this.state.playerStates.get(playerId)
            if (action === 'add') {
              this.addPlayerEvent(playerState)
            } else if (action === 'delete') {
              this.removePlayerEvent(playerState)
            }
          })
        }
        if (event.path.length > 0) {
          const playerId = event.path[0]
          const playerState = this.state.playerStates.get(playerId)
          this.updatePlayerEvent(playerState)
        }
      }
    })
  }


  emitPlayerEvent (eventName, playerState) {
    console.log('emitPlayerEvent', eventName, playerState)
    if (playerState) {
      const playerModel = playerStateToModel(playerState)
      this.emit(eventName, playerModel)
    } else {
      console.warn(`Can't emit ${eventName}`, playerState)
    }
  }


  addPlayerEvent (playerState) {
    const playerId = playerState.id
    if (playerId !== lsGetPlayerId()) {
      this.emitPlayerEvent('addPlayer', playerState)
    }
  }

  updatePlayerEvent (playerState) {
    const playerId = playerState.id
    if (playerId !== lsGetPlayerId()) {
      this.emitPlayerEvent('updatePlayer', playerState)
    }
  }

  removePlayerEvent (playerState) {
    const playerId = playerState.id
    if (playerId !== lsGetPlayerId()) {
      this.emitPlayerEvent('removePlayer', playerState)
    }
  }

  addConnectPlayerEvent (clientId, playerState) {
    if (clientId !== this.clientId) {
      this.emitPlayerEvent('addConnectPlayer', playerState)
    }
  }

  connectPlayerEvent (clientId, playerState) {
    if (clientId !== this.clientId) {
      // If the player hasn't been added yet, add now
      if (!this.state.playerStates.has(playerState.id)) {
        this.emitPlayerEvent('addConnectPlayer', playerState)
      } else {
        this.emitPlayerEvent('connectPlayer', playerState)
      }
    }
  }

  disconnectPlayerEvent (clientId, clientState) {
    if (clientId !== this.clientId) {
      this.emitPlayerEvent(clientState, 'disconnectPlayer')
    }
  }

  // Broadcasts the player's profile and position
  broadcastPlayer(player) {
    const playerState = playerModelToState(player.model)
    console.log('broadcastPlayer', player.model, playerState)
    this.broadcastPlayerState(playerState)
  }

  broadcastPlayerState(playerState) {
    this.wsProvider.awareness.setLocalState(playerState)
  }

  findOrCreatePlayerState (playerId) {
    let player
    if(!this.state.players.has(playerId)) {
      player = new Y.Map()
      this.state.players.set(playerId, player)
    } else {
      player = this.state.players.get(playerId)
    }
    return player
  }
}

function guestNameFromPlayerId(playerId) {
  return 'Guest-' + playerId.slice(0, 3)
}

function defaultPlayerState() {
  const id = lsGetPlayerId()
  const nm = guestNameFromPlayerId(id)
  const avatarOption = avatarOptionFromPlayerId(id)
  return { id, nm, gn: avatarOption.gender, av: avatarOption.avatarId }
}

/**
 * Returns the `playerId` stored in LocalStorage. If none is stored,
 * randomly generates a playerId and stores it.
 * 
 * @returns {string} playerId
 */
function lsGetPlayerId() {
  // Optimization: return cached playerId if already set
  if (playerId) { return playerId }

  let id = localStorage.getItem('playerId')
  if (!id) {
    id = playerId = uuidv4()
    localStorage.setItem('playerId', id)
  }
  return id
}

/**
 * Get PlayerState of local player from LocalStorage
 * 
 * @returns {PlayerState}
 */
function lsGetPlayerState() {
  return Object.assign(
    defaultPlayerState(),
    JSON.parse(localStorage.getItem('playerState') || '{}'))
}

/**
 * Store playerState in LocalStorage
 * 
 * @param {PlayerState} playerState 
 */
function lsSetPlayerState(updates) {
  let playerState = Object.assign(lsGetPlayerState(), updates)
  localStorage.setItem('playerState', JSON.stringify(playerState))
}

// function lsSetPlayerState({name, gender, avatarId, position}) {
//   if (name) { localStorage.setItem('name', name) }
//   if (gender) { localStorage.setItem('gender', gender) }
//   if (avatarId) { localStorage.setItem('avatarId', avatarId) }
//   if (position) { localStorage.setItem('position', JSON.stringify(position))}
// }


export {
  lsGetPlayerId,
  lsGetPlayerState,
  lsSetPlayerState,
  Network,
}
