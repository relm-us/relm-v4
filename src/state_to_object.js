
function stateToObject(type, state) {
  const object = { type }
  for (let key in state) {
    if (state[key].target !== undefined) {
      object[key] = state[key].target
    }
  }
  return object
}

export { stateToObject }