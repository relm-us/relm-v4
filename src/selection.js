const DECORATION_NORMAL_COLOR = new THREE.Color(0x000000)
const DECORATION_SELECTED_COLOR = new THREE.Color(0x666600)

let selectedObject = null
let wouldSelectObject = null
let previouslyWouldSelectObject = null

const setWouldSelectObject = (object) => {
  wouldSelectObject = object
  if (wouldSelectObject) {
    if (wouldSelectObject === selectedObject) {
      // do nothing
      if (previouslyWouldSelectObject && wouldSelectObject !== previouslyWouldSelectObject) {
        previouslyWouldSelectObject.setEmissive(DECORATION_NORMAL_COLOR)
      }
    } else if (previouslyWouldSelectObject === null) {
      // wouldSelectObject.setEmissive(DECORATION_HOVER_COLOR)
    } else if (wouldSelectObject !== previouslyWouldSelectObject) {
      // wouldSelectObject.setEmissive(DECORATION_HOVER_COLOR)
      if (previouslyWouldSelectObject !== selectedObject) {
        previouslyWouldSelectObject.setEmissive(DECORATION_NORMAL_COLOR)
      }
    }
    previouslyWouldSelectObject = wouldSelectObject
  } else if (!wouldSelectObject && previouslyWouldSelectObject) {
    if (previouslyWouldSelectObject !== selectedObject) {
      previouslyWouldSelectObject.setEmissive(DECORATION_NORMAL_COLOR)
    }
    previouslyWouldSelectObject = null
  }
}

const selectObject = () => {
  if (selectedObject) {
    selectedObject.setEmissive(DECORATION_NORMAL_COLOR)
  }
  if (selectedObject != wouldSelectObject) {
    selectedObject = wouldSelectObject
    if (selectedObject) {
      const isLocked = selectedObject.isUiLocked && selectedObject.isUiLocked()
      if (!isLocked) {
        selectedObject.setEmissive(DECORATION_SELECTED_COLOR)
      }
    }
  }
}

export { setWouldSelectObject, selectObject, selectedObject }