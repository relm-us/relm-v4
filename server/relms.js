function hasRelm(name) {
  const control = `${relm}.c`
  return yws.docs.has(control)  
}

function createRelm(name) {
  const control = `${relm}.c`
  
  const tversion = util.uuidv4()
  const transient = `${name}.t.${tversion}`
  
  const pversion = util.uuidv4()
  const permanent = `${name}.p.${pversion}`
  
  yws.docs.set(control, new Y.Doc())
  yws.docs.set(transient, new Y.Doc())
  yws.docs.set(permanent, new Y.Doc())
  
  const versionsMap = yws.docs.get(control).getMap('versions')
  versionsMap.set('transient', tversion)
  versionsMap.set('permanent', pversion)
  
  return { control, transient, permanent }
}

function getRelms() {
  const relms = {}
  
  const findOrCreate = (name) => {
    if (!relms[name]) {
      relms[name] = {
        control: null,
        settings: {},
        allVersions: {
          transients: [],
          permanents: [],
        }
      }
    }
    return relms[name]
  }
  
  yws.docs.forEach((ydoc, docName) => {
    const m = docName.match(/^(.*)\.c$/)
    const other = docName.match(/^([^\.]+)\.([tp])\.([^\.]+)$/)
    if (m) {
      const name = m[1]

      const relm = findOrCreate(name)
      
      relm.control = docName
      for (const [k, v] of ydoc.share.entries()) {
        relm.settings[k] = v.toJSON()
      }
    } else if (other) {
      const name = other[1]
      const type = other[2]
      const version = other[3]
      
      const relm = findOrCreate(name)
      switch (type) {
        case 't':
          relm.allVersions.transients.push(version)
          break
        case 'p':
          relm.allVersions.permanents.push(version)
          break
        default:
          console.error(`unknown doc type '${type}' in '${docName}'`)
      }
    }
  })
}

module.exports = {
  getRelms,
}