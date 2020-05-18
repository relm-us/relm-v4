/**
 * Generates a random UUID (version 4). This can be used as a decentralized way
 * to create an identifier that has such a low probability of collision that it
 * can essentially be treated as universally unique.
 * 
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Converts a string's characters to numeric equivalents and sums their values.
 * 
 * @param {string} str String whose characters should be summed
 * @returns {number}
 */
function sumString (str) {
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
function checkOverflow(el)
{
  const curOverflow = el.style.overflow;
  if ( !curOverflow || curOverflow === "visible" ) {
    el.style.overflow = "hidden"
  }
  const isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight
  el.style.overflow = curOverflow
  return isOverflowing
}

export {
  uuidv4,
  sumString,
  getRandomInt,
  coinToss,
  checkOverflow
}