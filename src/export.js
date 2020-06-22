const exportRelm = (stage, network, selectedOnly, room) => {
  const allObjects = {}
  let uuids
  if (selectedOnly) {
    uuids = stage.selection.getAllEntities().map((entity) => entity.uuid)
  } else {
    uuids = network.permanents.objects.keys()
  }
  
  Array.from(uuids).forEach(uuid => {
    const entity = stage.entities[uuid]
    const json = entity.goals.toJSON(true)
    allObjects[uuid] = json
  })
  return {
    "relm": room,
    "timestamp": (new Date()).toISOString(),
    "relm-export-version": "2.0",
    "objects": allObjects
  }
}

const importRelm1_0 = (network, data) => {
  throw Error(`This version is no longer supported`)
}

const importRelm2_0 = (network, data) => {
  const objects = data.objects
  let importCount = 0
  console.log('importl', network, data)
  for (let uuid in objects) {
    const object = objects[uuid]
    importCount++
    network.permanents.fromJSON(object)
  }
  return importCount

}

const importRelm = (network, data) => {
  const version = data['relm-export-version']
  switch (version) {
    case "1.0": return importRelm1_0(network, data)
    case "2.0": return importRelm2_0(network, data)
    default:
      throw Error(`Unable to import version ${version}`)
  }
}

export { exportRelm, importRelm }