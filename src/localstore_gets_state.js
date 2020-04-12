
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
      if (!this.lsKey)
      this.lsGetsStateCounter++
      if (this.lsGetsStateCounter % 60 === 0) {
        const object = stateToObject(this.uuid, this.state)
        for (let key in object) {
          let value = JSON.stringify(object[key])
          localStorage.setItem(`${this.lsKey}.${key}`, value)
        }
      }
    }
  }
})

function LocalstoreRestoreState(lsKey, entity) {
  for (let key in entity.state) {
    let value = JSON.parse(localStorage.getItem(`${lsKey}.${key}`))
    if (value !== null) {
      if (typeof entity.state[key].target.copy === 'function') {
        // Used for Vector3 and Quaternion stored values
        // FIXME: once we can use get/set methods, this can go away
        //   see: https://github.com/stampit-org/stamp/issues/79
        entity.state[key].target.copy(value)
      } else {
        entity.state[key].target = value
      }
    }
  }
}

export { LocalstoreGetsState, LocalstoreRestoreState }
