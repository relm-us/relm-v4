
function stateToObject(type, state) {
  const object = { type }
  for (let key in state) {
    const target = state[key].target
    if (target && target.isQuaternion) {
      // Special case for quaternions whose serialization normally includes _x, _y, _z, _w
      // but has special getter methods x, y, z, w
      object[key] = {x: target.x, y: target.y, z: target.z, w: target.w}
    } else if (target !== undefined) {
      object[key] = target
    }
  }
  return object
}

export { stateToObject }