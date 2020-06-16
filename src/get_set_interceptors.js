
/**
 * Modifies a Map or Y.Map and installs a `get` and a `set` interceptor. Allows us to spy
 * on Y.Map calls that we don't want Yjs to handle (for example, transient `position` and
 * `rotation` goals).
 * 
 * @param {Y.Map} map - the Map or Y.Map object to install get/set interceptors on
 * @param {Array<string>} keysToIntercept - a list of keys to intercept
 * @param {Function(key)} get - the `get` callback that receives intercepted `get` calls
 * @param {Function(key,value)} set - the `set` callback that receives intercepted `set` calls
 */
const installGetSetInterceptors = (map, keysToIntercept, { has, get, set, toJSON }) => {
  map.has = new Proxy(map.has, {
    apply: (target, thisArg, argumentsList) => {
      if (argumentsList.length == 1) {
        const key = argumentsList[0]
        if (keysToIntercept.includes(key)) {
          return has(key)
        }
      }
      // If not intercepted, call original `has` function:
      return target.apply(thisArg, argumentsList)
    }
  })
  
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
  
  map.toJSON = new Proxy(map.toJSON, {
    apply: (target, thisArg, argumentsList) => {
      if (argumentsList.length == 0) {
        const json = target.apply(thisArg, argumentsList)
        return toJSON(json)
      }
      // If not intercepted, call original `set` function:
      return target.apply(thisArg, argumentsList)
    }
  })
}

export { installGetSetInterceptors }
