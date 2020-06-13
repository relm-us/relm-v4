import stampit from 'stampit'

const Typed = stampit({
  statics: {
    registeredTypes: {},
    
    setType(type) {
      const newStamp = this.conf({ type })
      this.registeredTypes[type] = newStamp
      return newStamp
    },

    getType(type) {
      return this.registeredTypes[type]
    }
  },
  init(_, { stamp }) {
    this.type = stamp.compose.configuration.type
  }
})

export { Typed }
