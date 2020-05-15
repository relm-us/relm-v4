import stampit from 'stampit'

import { Component } from './component.js'

const CanUiLock = stampit(Component, {
  props: {
    uiLocked: false
  },

  init({ uiLocked = this.uiLocked }) {
    this.uiLocked = uiLocked
  },

  methods: {
    uiLock() {
      this.uiLocked = true
    },

    uiUnlock() {
      this.uiLocked = false
    }
  }
})