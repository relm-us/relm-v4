export const UV_MAX_RANGE = 4096

// Modulus with sensible wrap-around for negative numbers
function mod(n, m) {
  return ((n % m) + m) % m
}

export function reskin(uvAttr, fn) {
  for (var i = 0; i < uvAttr.count; i++) {
    const [u2, v2] = fn(uvAttr, i)

    uvAttr.setXY(i, u2, v2)
  }
  uvAttr.needsUpdate = true
}

export function translateWithMask(x, y, mask) {
  return (uvAttr, i) => {
    const u = uvAttr.getX(i)
    const v = uvAttr.getY(i)

    if (mask[i] === 0) {
      return [u, v]
    } else {
      const tu = mod(u + x, UV_MAX_RANGE)
      const tv = mod(v + y, UV_MAX_RANGE)

      return [tu, tv]
    }
  }
}

// A "Mask" is an array whose positions correspond to verticies:
//   0: not allowed to change
//   1: allowed to change
export function createMask(uvAttr, fnAllow) {
  const mask = new Uint8Array(uvAttr.count)
  for (let i = 0; i < uvAttr.count; i++) {
    const x = uvAttr.getX(i)
    const y = uvAttr.getY(i)
    mask[i] = fnAllow(x, y, i) ? 1 : 0
  }
  return mask
}

/**
 * Translate the UV map by the given x, y amount. Note that this translation
 * is relative. If absolute translation is desired, the UV map should be
 * reset to its original coordinates first.
 */
export function uvTranslate(uvAttr, translate, mask) {
  reskin(uvAttr, translateWithMask(translate.x, translate.y, mask))
}

export function maskAllowSkinTones(x, y) {
  return (
    (x >= 2252 && x < 4096 && y >= 1020 && y < 1740) || (x <= 610 && y <= 800)
  )
}

export function maskAllowOtherColors(x, y) {
  return !maskAllowSkinTones(x, y)
}
