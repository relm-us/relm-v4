import stampit from 'stampit'
import * as Y from 'yjs'

const doc = new Y.Doc()

const store = {
  position: { x: 0, y: 0, z: 0},
  rotation: { x: 0, y: 1, z: 0},
}


const installGetSetInterceptors = (map, keysToIntercept, { get, set }) => {
  map.get = new Proxy(map.get, {
    apply: (target, thisArg, argumentsList) => {
      if (argumentsList.length == 1) {
        const key = argumentsList[0]
        if (keysToIntercept.includes(key)) {
          return get(key)
        }
      }
      // If not intercepted, call original `get` function:
      return target.apply(thisArg, argumentsList)
    }
  })
  
  map.set = new Proxy(map.set, {
    apply: (target, thisArg, argumentsList) => {
      if (argumentsList.length == 2) {
        const key = argumentsList[0]
        if (keysToIntercept.includes(key)) {
          const value = argumentsList[1]
          set(key, value)
          return value
        }
      }
      // If not intercepted, call original `set` function:
      return target.apply(thisArg, argumentsList)
    }
  })
}

const map = doc.getMap('objects')
installGetSetInterceptors(map, ['position', 'rotation'], {
  get: (key) => {
    return store[key]
  },
  set: (key, value) => {
    store[key] = value
  }
})

console.log('store before', JSON.stringify(store))

console.log('map.get abc', map.get('abc'))
console.log('map.get position', map.get('position'))

console.log('map.set abc = 1', map.set('abc', 1))
console.log('map.get abc', map.get('abc'))

console.log('map.set position = { x: 3, y: 4, z: 5 }', map.set('position', {x:3,y:4,z:5}))
console.log('map.get position', map.get('position'))

console.log('store after', JSON.stringify(store))

console.log('map.toJSON', map.toJSON())