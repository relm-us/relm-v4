import { showToast } from './lib/Toast.js'

// Take one or more arguments from an array, or throw an error
const take = (n, args, errorMessage) => {
  if (n < 1) {
    throw Error(`'take' must be called with n >= 1 (n = ${n})`)
  } else if (n > args.length) {
    // throw Error(`'take' must be called with n <= args.length (args.length = ${args.length})`)
    throw Error(errorMessage)
  } else if (args.length >= n) {
    const taken = []
    for (let i = 0; i < n; i++) {
      taken.push(args.shift())
    }
    return taken
  } else {
    throw Error(errorMessage)
  }
}

const takeOne = (args, errorMessage) => take(1, args, errorMessage)[0]

const joinAll = (args) => {
  if (args.length > 0) {
    return args.join(' ')
  } else {
    return null
  }
}

const parseCommandString = (commandString) => {
  if (commandString && commandString.length > 0) {
    const parts = commandString.split(' ')
    return [parts[0], parts.slice(1)]
  } else {
    return [null, []]
  }
}

const requireObjects = (env) => {
  if (env.objects.length === 0) { throw Error('No objects selected') }
}

const actionToEachObject = (action, onSuccess) => {
  return (env) => {
    requireObjects(env)
    let successCount = 0
    const totalCount = env.objects.length
    for (let i = 0; i < totalCount; i++) {
      if (action(env.objects[i], env)) {
        successCount++
      }
    }
    if (onSuccess) {
      onSuccess(successCount, totalCount)
    } else {
      if (totalCount === 1) {
        if (successCount === 1) {
          showToast(`Command succeeded`)
        } else {
          showToast(`Command failed (see JS console)`)
          console.warn('Command failed', env)
        }
      } else {
        showToast(`Command succeeded on ${successCount} of ${totalCount} objects`)
      }
    }
  }
}

export {
  take,
  takeOne,
  joinAll,
  parseCommandString,
  requireObjects,
  actionToEachObject,
}