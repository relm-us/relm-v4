import { stateToObject } from "../state_to_object.js"

const relmExport = (stage, network) => {
  const allObjects = {}
  Array.from(network.entityStates.keys()).forEach(uuid => {
    const entity = stage.entities[uuid]
    allObjects[uuid] = stateToObject(entity.type, entity.state)
  })
  return {
    "relm-export-version": "1.0",
    "objects": allObjects
  }
}

const relmImport1_0 = (network, data) => {
  const objects = data.objects
  let importCount = 0
  for (let uuid in objects) {
    const object = objects[uuid]
    importCount++
    network.setState(uuid, object)
  }
  return importCount
}

const relmImport = (network, data) => {
  const version = data['relm-export-version']
  switch (version) {
    case "1.0":
      return relmImport1_0(network, data)
    default:
      console.error("Unable to import version ${")
  }
}

export { relmExport, relmImport }