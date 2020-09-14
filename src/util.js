import { Color } from 'three'

/**
 * A simple way to mark some function parameters as required
 *
 * @param {string} missing - the name of the potentially missing parameter
 */
function req(missing) {
  throw new Error('Missing ' + missing)
}

/**
 * Generates a random UUID (version 4). This can be used as a decentralized way
 * to create an identifier that has such a low probability of collision that it
 * can essentially be treated as universally unique.
 *
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Find a named UUID in local storage, or create one if not found.
 *
 * @param {string} name - name of the local ID, e.g. 'secureId', or 'mouseId'
 */
const getOrCreateLocalId = (name) => {
  let uuid = localStorage.getItem(name)
  if (!uuid) {
    uuid = uuidv4()
    localStorage.setItem(name, uuid)
  }
  return uuid
}

/**
 * Converts a string's characters to numeric equivalents and sums their values.
 *
 * @param {string} str String whose characters should be summed
 * @returns {number}
 */
function sumString(str) {
  return [...str].reduce((sum, c) => sum + c.charCodeAt(0), 0)
}

/**
 * Randomly generate an integer up to (but not including) `max`.
 *
 * @param {number} max Randomly generated number will be up to max - 1
 * @returns {number}
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}

/**
 * Randomly generates a coin toss--0 or 1
 *
 * @returns {number}
 */
function coinToss() {
  return getRandomInt(2)
}

// Determines if the passed element is overflowing its bounds,
// either vertically or horizontally.
// Will temporarily modify the "overflow" style to detect this
// if necessary.
function checkOverflow(el) {
  const curOverflow = el.style.overflow
  if (!curOverflow || curOverflow === 'visible') {
    el.style.overflow = 'hidden'
  }
  const isOverflowing =
    el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight
  el.style.overflow = curOverflow
  return isOverflowing
}

function mapToObject(map) {
  if (map.toJSON) {
    return map.toJSON()
  } else {
    const out = Object.create(null)
    map.forEach((value, key) => {
      if (value instanceof Map) {
        out[key] = mapToObject(value)
      } else {
        out[key] = value
      }
    })
    return out
  }
}

function randomPastelColor() {
  const hue = Math.floor(Math.random() * 360)
  const color = new Color(`hsl(${hue}, 100%, 58%)`)
  return {
    r: color.r,
    g: color.g,
    b: color.b,
  }
}

const domReady = () => {
  return new Promise((resolve, reject) => {
    if (document.readyState !== 'loading') {
      resolve()
    } else {
      document.addEventListener('DOMContentLoaded', resolve)
    }
  })
}

/**
 * Set union - taken from MDN
 *
 * @param {Set} setA
 * @param {Set} setB
 */
function union(setA, setB) {
  let _union = new Set(setA)
  for (let elem of setB) {
    _union.add(elem)
  }
  return _union
}

/**
 * Set difference - taken from MDN
 *
 * @param {Set} setA
 * @param {Set} setB
 */
function difference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

/**
 * Set intersection - taken from MDN
 *
 * @param {Set} setA
 * @param {Set} setB
 */
function intersection(setA, setB) {
  let _intersection = new Set()
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection
}

function sortByZ(a, b) {
  return a.object.position.z - b.object.position.z
}

function delta(a, b) {
  const x = b.x - a.x
  const y = b.y - a.y
  return { x, y }
}
function distance(a, b) {
  const { x, y } = delta(a, b)
  return Math.sqrt(x * x + y * y)
}

// check for webp support:
//   'feature' can be one of 'lossy', 'lossless', 'alpha' or 'animation'.
//   'callback(feature, isSupported)' will be passed back the detection result (in an asynchronous way!)
function checkWebpFeature(feature, callback) {
  var kTestImages = {
    lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    alpha:
      'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
    animation:
      'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
  }
  var img = new Image()
  img.onload = function () {
    var result = img.width > 0 && img.height > 0
    callback(feature, result)
  }
  img.onerror = function () {
    callback(feature, false)
  }
  img.src = 'data:image/webp;base64,' + kTestImages[feature]
}

/**
 * Convert a 3D position into a 2D screen coordinate
 *
 * @param {Vector3} position - 3D position to turn into a 2D coordinate by projection
 * @param {Camera} camera - the camera to use as the projection
 * @param {{width: float, height: float}} screen - width and height of the screen or canvas
 */
function project2d(position, camera, screen) {
  position.project(camera)
  position.x = ((position.x + 1) * screen.width) / 2
  position.y = (-(position.y - 1) * screen.height) / 2
  position.z = 0
}

export {
  uuidv4,
  getOrCreateLocalId,
  sumString,
  getRandomInt,
  coinToss,
  checkOverflow,
  mapToObject,
  randomPastelColor,
  req,
  domReady,
  union,
  difference,
  intersection,
  sortByZ,
  delta,
  distance,
  checkWebpFeature,
  project2d,
}
