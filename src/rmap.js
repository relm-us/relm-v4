import { EventEmitter } from 'events'

function mapToObject(map) {
  const out = Object.create(null)
  map.forEach((value, key) => {
    if (value instanceof Map) {
      out[key] = mapToObject(value)
    }
    else {
      out[key] = value
    }
  })
  return out
}

/**
 * The "Relm Map" mimics Y.Map behavior in ways we care about. This is used in the GoalGroup/Goal
 * system such that we can use transient 'awareness' or permanent 'Y.Doc' state for in-game objects.
 */
class RMap extends Map {
  toJSON() {
    return mapToObject(this)
  }

  observe(f) {
    console.log('rmap observe called')
    this.on('changed', f)
  }
}

// Save the original 'set' function
RMap.prototype._set = RMap.prototype.set

Object.assign(RMap.prototype, EventEmitter.prototype, {
  set: function (k, v) {
    this._set(k, v)
    this.emit('changed', k, v)
  }
})

export {
  RMap as Map,
}