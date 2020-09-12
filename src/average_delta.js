import { MathUtils } from 'three'

var lastTimeMsec = null

// setup delta variables for smoother animation
var avgDelta = 0.02
var numberOfFramesToAverage = 24
var numberOfFramesToAverageMax = numberOfFramesToAverage

// setup bumpiness variables to detect sudden changes in scene complexity
var bumpiness = 0

var fastAvgBumpiness = 0.012
var fastAvgBumpinessFrames = 20

var slowAvgBumpiness = 0.01
var slowAvgBumpinessFrames = 24

var bumpinessDeviationTrigger = 1.02

function calculateAverageDelta(nowMsec) {
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
  lastTimeMsec = nowMsec

  var delta = deltaMsec / 1000

  // get a smoother delta by averaging a # of frame deltas (numberOfFramesToAverage)
  avgDelta =
    (avgDelta * numberOfFramesToAverage + delta) / (numberOfFramesToAverage + 1)

  // detect bumpiness levels in case the scene complexity changes rapidly
  bumpiness = Math.abs(delta - avgDelta)
  fastAvgBumpiness =
    (fastAvgBumpiness * fastAvgBumpinessFrames + bumpiness) /
    (fastAvgBumpinessFrames + 1)
  slowAvgBumpiness =
    (slowAvgBumpiness * slowAvgBumpinessFrames + bumpiness) /
    (slowAvgBumpinessFrames + 1)

  if (fastAvgBumpiness > slowAvgBumpiness * bumpinessDeviationTrigger) {
    numberOfFramesToAverage = 0
  } else {
    numberOfFramesToAverage = MathUtils.clamp(
      numberOfFramesToAverage + 1,
      1,
      numberOfFramesToAverageMax
    )
  }

  return avgDelta
}

export { calculateAverageDelta }
