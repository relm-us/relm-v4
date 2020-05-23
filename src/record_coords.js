const recordings = new WeakMap()

const NEAR_THRESHOLD = 5

const isNearPreviousCoords = (c1, c2) => {
  const dx = c1.x - c2.x
  const dy = c1.y - c2.y
  return Math.sqrt(dx * dx + dy * dy) <= NEAR_THRESHOLD
}

const recordCoords = (coords, callback) => {
  const isNear = recordings[callback] && isNearPreviousCoords(coords, recordings[callback])
  callback(isNear)
  recordings[callback] = coords
}

export {
  recordCoords
}