
function stateToObject(uuid, state) {
  const object = { uuid }
  for (let key in state) {
    if (state[key].target) {
      object[key] = state[key].target
    }
  }
  return object
}

export { stateToObject }