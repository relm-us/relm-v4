import { uuidv4 } from './util.js'

/**
 * Since HTML DOM `dataset` can't store references to objects, we create
 * a Map that stores the references, and then use a unique string (UUID)
 * to point to the reference. A DOM element can then store a "reference".
 */

const references = new Map()

function setRef(el, object, key = 'reference') {
  const id = uuidv4()
  el.dataset[key] = id
  references.set(id, object)
}

function getRef(el, key = 'reference') {
  const id = el.dataset[key]
  return references.get(id)
}

export { setRef, getRef }
