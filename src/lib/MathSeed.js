Math.seed = function (s) {
  var mask = 0xffffffff
  var mW = (123456789 + s) & mask
  var mZ = (987654321 - s) & mask

  return function () {
    mZ = (36969 * (mZ & 65535) + (mZ >>> 16)) & mask
    mW = (18000 * (mW & 65535) + (mW >>> 16)) & mask

    var result = ((mZ << 16) + (mW & 65535)) >>> 0
    result /= 4294967296
    return result
  }
}

// Randomly returns -1 or 1
Math.flip = function (seed) {
  return ((Math.floor(seed() * 2)) - 0.5) * 2
}
