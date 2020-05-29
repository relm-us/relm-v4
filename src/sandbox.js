import stampit from 'stampit'


const Typed = stampit({
  statics: {
    setType(type) {
      this.type = type
      return this
    }
  },
  init(_, { stamp }) {
    this.type = stamp.type
  }
})

const Entity = window.Entity = stampit({
  init() {
    this.isEntity = true
  }
}).compose(Typed).setType('john')

const e = Entity()
console.log(Entity, e.type, Entity.type)

