
import stampit from 'stampit'

import { Component } from './components/component.js'

// Pick a number that is frequent enough that state is saved when player changes character/name etc.
// but infrequent enough that it doesn't affect framerate. Bonus if it's a prime number.
const SAVE_EVERY_NTH_FRAME = 73

/**
 * Stores an Entity's state to "long term storage" aka LocalStorage
 */
const LocalstoreGetsState = stampit(Component, {
  init() {
    this._lsGetsStateCounter = 0
  },
  
  methods: {
    localstoreRestore() {
    },
    
    update(delta) {
      this._lsGetsStateCounter++
      if (this._lsGetsStateCounter % SAVE_EVERY_NTH_FRAME === 0) {
        const state = this.goals.toJSON()
        localStorage.setItem(this.uuid, JSON.stringify(state))
      }
    }
  }
})

const localstoreRestore = (uuid) => {
  return JSON.parse(localStorage.getItem(uuid) || null)
}

export { LocalstoreGetsState, localstoreRestore }
