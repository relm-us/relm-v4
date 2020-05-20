
import stampit from 'stampit'

import { Component } from './component.js'
import { stateToObject } from './state_to_object.js'

/**
 * Stores an Entity's state to "long term storage" aka LocalStorage
 */
const LocalstoreGetsState = stampit(Component, {
  props: {
    /**
     * The ltmKey can be set to the type of object, e.g. 'player', so that
     * the state can be stored separately from other things (e.g. mouse movement).
     */
    lsKey: 'state',
  },

  init({ lsKey = this.lsKey }) {
    if (!lsKey) {
      throw Error('LocalstoreGetsState must have lsKey')
    }
    this.lsKey = lsKey
    this.lsGetsStateCounter = 0
  },
  
  methods: {
    update(delta) {
      if (!this.lsKey) {
        return
      }
      this.lsGetsStateCounter++
      if (this.lsGetsStateCounter % 60 === 0) {
        const object = Object.assign({ uuid: this.uuid }, stateToObject(this.type, this.state))
        for (let key in object) {
          let value = JSON.stringify(object[key])
          localStorage.setItem(`${this.lsKey}.${key}`, value)
        }
      }
    }
  }
})

function localstoreRestoreState(lsKey, entity) {
  // Transitional: If player.type is null or undefined, it's an old version of localstorage data, so clear it
  if (!localStorage.getItem(`player.type`)) {
    localStorage.clear()
  }
  
  let foundSomething = false
  for (let key in entity.state) {
    let value = JSON.parse(localStorage.getItem(`${lsKey}.${key}`))
    if (value !== null) {
      foundSomething = true
      let specificState = entity.state[key]
      if (!specificState) { continue }
      if (specificState.target && typeof specificState.target.copy === 'function') {
        // Used for Vector3 and Quaternion stored values
        // FIXME: once we can use get/set methods, this can go away
        //   see: https://github.com/stampit-org/stamp/issues/79
        specificState.target.copy(value)
      } else {
        if (typeof value === 'object' && ('x' in value || 'r' in value)) {
          console.warn(`Assigning xyz or rgb value to ${key}`, value, specificState.target)
          // specificState.target = new THREE.Vector3()
          // specificState.target.copy(value)
        }
        specificState.target = value
      }
    }
  }
  
  // If local storage had something from a previous visit, return true
  return foundSomething
}

export { LocalstoreGetsState, localstoreRestoreState }
