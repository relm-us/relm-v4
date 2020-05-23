import stampit from 'stampit'

/**
 * Component that allows an object to be selected with the mouse or touchpad.
 * 
 * It's also convenient to wrap 'uiLocked' into this component because it's always
 * the case that if an object can be selected, we also want to be able to lock it
 * so it can't be selected.
 */
const ReceivesPointer = stampit({
  deepProps: {
    state: {
      uiLocked: {
        target: false
      }
    }
  },

  init({ uiLocked }) {
    this.receivesPointer = true
    if (typeof uiLocked === 'undefined') {
      this.state.uiLocked.target = false
    } else {
      this.state.uiLocked.target = uiLocked
    }
  },

  methods: {
    uiLockToggle() {
      this.state.uiLocked.target = !this.state.uiLocked.target
    },

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

export { ReceivesPointer }