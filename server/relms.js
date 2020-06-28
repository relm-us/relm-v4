const map = require('lib0/dist/map.cjs')

const yws = require('./yws.js')
const Y = require('yjs')
const util = require('./util.js')


/**
 * A ControlName consists of the relm name + ".c" as a suffix (short for "control room")
 */
const CONTROL_NAME_RE = /^(.*)\.c$/


function getRelmControlName(name) {
  return `${name}.c`
}

function relmExists(name) {
  return yws.docs.has(getRelmControlName(name))  
}


function createRelm(name) {
  const controlName = getRelmControlName(name)
  const control = yws.findOrCreateDoc(controlName)
  const versionsMap = control.getMap('versions')
  
  const transientVersion = util.uuidv4()
  map.setIfUndefined(versionsMap, 'transient', () => new Y.Array())
  versionsMap.get('transient').insert(0, [transientVersion])
  
  const permanentVersion = util.uuidv4()
  map.setIfUndefined(versionsMap, 'permanent', () => new Y.Array())
  versionsMap.get('permanent').insert(0, [permanentVersion])
  
  return { control, controlName }
}


function getRelms() {
  const relms = {}
  
  yws.docs.forEach((ydoc, docName) => {
    const m = docName.match(CONTROL_NAME_RE)
    if (m) {
      const name = m[1]
      relms[name] = {
        control: docName,
        settings: yDocToJSON(ydoc)
      }
    }
  })

  return relms
}


function yDocToJSON(ydoc) {
  const doc = {}

  for (const [k, v] of ydoc.share.entries()) {
    doc[k] = v.toJSON()
  }
  
  return doc
}


function getRelmNameFromRequest(req) {
  return req.url.slice(1).split('?')[0]
}


module.exports = {
  relmExists,
  getRelms,
  createRelm,
  getRelmNameFromRequest,
  yDocToJSON,
}