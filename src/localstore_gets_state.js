
import stampit from 'stampit'

import { Component } from './components/component.js'
import { stateToObject } from './state_to_object.js'

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
      // if (this._lsGetsStateCounter % SAVE_EVERY_NTH_FRAME === 0) {
      //   localStorage.setItem(this.uuid, JSON.stringify(this.goalsToJSON()))
      // }
    }
  }
})

const localstoreRestore = (uuid) => {
  const stateJson = localStorage.getItem(uuid)
  if (stateJson) {
    const state = JSON.parse(stateJson)
    return state
  }
}

export { LocalstoreGetsState, localstoreRestore }
