import { Observable } from 'lib0/observable.js'

class AArray extends Observable {
  insert(index, content) {
    
  }
}

class Doc extends Observable {
  constructor() {
    super()
  }

  getArray (name) {
    if (!this._map.has(name)) {
      this._map.set(name, new AArray())
    }
    return this._map.get(name)
  }

  on (eventName, f) { super.on(eventName, f) }
  off (eventName, f) { super.off(eventName, f) }
}

export {
  Doc,
  AArray as Array,
  AMap as Map,
}