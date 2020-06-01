import stampit from 'stampit'

import { Stage } from './stage.js'

const Typed = stampit({
  statics: {
    setType(type) {
      const newStamp = this.conf({ type })
      Stage.registerType(type, newStamp)
      return newStamp
    }
  },
  init(_, { stamp }) {
    this.type = stamp.compose.configuration.type
  }
})

export { Typed }
