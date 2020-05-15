import stampit from 'stampit'

import { Component } from './component.js'

const CanUiLock = stampit(Component, {
  deepProps: {
    state: {
      uiLocked: {
        target: false
      }
    }
  },

  init({ uiLocked }) {
    if (typeof uiLocked === 'undefined') {
      this.state.uiLocked.target = false
    } else {
      this.state.uiLocked.target = uiLocked
    }
  },

  methods: {
    uiLock() {
      this.state.uiLocked.target = true
    },

    uiUnlock() {
      this.state.uiLocked.target = false
    },

    isUiLocked() {
      return this.state.uiLocked.target
    }
  }
})

export { CanUiLock }
