import { uuidv4 } from './util.js'
import { avatarOptionFromPlayerId } from './avatars.js'

let playerId
let playerState

const LongTermMemory = window.memory = {
  /**
   * Returns the `playerId` stored in LocalStorage. If none is stored,
   * randomly generates a playerId and stores it.
   * 
   * @returns {string} playerId
   */
  getOrCreatePlayerId() {
    if (!playerId) {
      playerId = localStorage.getItem('playerId')
      if (!playerId) {
        playerId = uuidv4()
        localStorage.setItem('playerId', playerId)
      }
    }
    return playerId
  },

  getOrCreatePlayerState(playerId) {
    if (!playerState) {
      const playerStateJson = localStorage.getItem('playerState')
      if (!playerStateJson) {
        playerState = defaultPlayerState(playerId)
        LongTermMemory.setPlayerState(playerState)
      } else {
        playerState = JSON.parse(playerStateJson)
      }
    }
    return playerState
  },

  setPlayerState(playerState) {
    localStorage.setItem('playerState', JSON.stringify(playerState))
  },

  clear() {
    localStorage.removeItem('playerId')
    localStorage.removeItem('playerState')
  }
  
}

function guestNameFromPlayerId(playerId) {
  return 'Guest-' + playerId.slice(0, 3)
}

function defaultPlayerState(playerId) {
  const name = guestNameFromPlayerId(playerId)
  const option = avatarOptionFromPlayerId(playerId)
  return {
    name: name,
    gender: option.gender,
    avatarId: option.avatarId
  }
}

export { LongTermMemory }