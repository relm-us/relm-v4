import stampit from 'stampit'

import { defineGoal } from './goals/goal.js'

/**
 * Component that allows an object to be selected with the mouse or touchpad.
 * 
 * It's also convenient to wrap 'uiLocked' into this component because it's always
 * the case that if an object can be selected, we also want to be able to lock it
 * so it can't be selected.
 */
const ReceivesPointer = stampit({
  deepStatics: {
    goalDefinitions: {
      uiLocked: defineGoal('locked', { v: false })
    }
  },

  init() {
    this.receivesPointer = true
  },

  methods: {
    uiLockToggle() {
      this.goals.uiLocked.update({ v: !this.isUiLocked() })
    },

    uiLock() {
      this.goals.uiLocked.update({ v: true })
    },

    uiUnlock() {
      this.goals.uiLocked.update({ v: false })
    },

    isUiLocked() {
      return this.goals.uiLocked.get('v')
    },

    isEffectivelyUiLocked() {
      return !this.stage.editorMode // && this.state.uiLocked.target
    }
  }
})

export { ReceivesPointer }