import stampit from 'stampit'

import { Network } from './network.js'

const Typed = stampit({
  statics: {
    setType(type) {
      const newStamp = this.conf({ type })
      Network.registerType(type, newStamp)
      return newStamp
    }
  },
  init(_, { stamp }) {
    this.type = stamp.compose.configuration.type
  }
})

export { Typed }
