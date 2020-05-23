import stampit from 'stampit'

const DECORATION_NORMAL_COLOR = new THREE.Color(0x000000)
const DECORATION_SELECTED_COLOR = new THREE.Color(0x666600)

      
function union(setA, setB) {
  let _union = new Set(setA)
  for (let elem of setB) {
      _union.add(elem)
  }
  return _union
}

function difference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
      _difference.delete(elem)
  }
  return _difference
}

function intersection(setA, setB) {
  let _intersection = new Set()
  for (let elem of setB) {
      if (setA.has(elem)) {
          _intersection.add(elem)
      }
  }
  return _intersection
}


const Selection = stampit({
  props: {
    selected: null
  },

  init({ stage }) {
    this.stage = stage
    this.selected = new Set()
    this.savedPositions = new Map()
  },

  methods: {
    hasSelected() {
      return this.selected.size > 0
    },

    addSelection(entitiesSet) {
      const added = difference(entitiesSet, this.selected)
      entitiesSet.forEach((entity) => this.selected.add(entity))

      added.forEach((entity) => {
        if (entity.setEmissive) {
          entity.setEmissive(DECORATION_SELECTED_COLOR)
        }
      })
      
      return added
    },
    
    removeSelection(entitiesSet) {
      const removed = intersection(entitiesSet, this.selected)
      entitiesSet.forEach((entity) => this.selected.delete(entity))

      removed.forEach((entity) => {
        if (entity.setEmissive) {
          entity.setEmissive(DECORATION_NORMAL_COLOR)
        }
      })
      
      return removed
    },

    /**
     * Selects an array of entities, either by addition, subtraction, or by replacing.
     * 
     * @param {Array<Entity>} entities 
     * @param {string} setOperation One of '+', '-', or '='
     */
    select(entities, setOperation = null) {
      let selectedSet = new Set(entities)
      switch (setOperation) {
        case '=':
          // Everything is removed
          this.removeSelection(this.selected)
          // Then new selections are added
          return this.addSelection(selectedSet)
        case '+':
          return this.addSelection(selectedSet)
        case '-':
          return this.removeSelection(selectedSet)
        default: new Error(`Only '+', '-' and null are accepted as set operations for selection`)
      }
    },
    
    forEach(callback) {
      this.selected.forEach(callback)
    },

    savePositions(id) {
      this.savedPositions[id] = new WeakMap()
      this.selected.forEach((entity) => {
        const position = new THREE.Vector3()
        position.copy(entity.object.position)
        this.savedPositions[id][entity] = position
      })
    },

    savedPositionFor(id, entity) {
      return this.savedPositions[id][entity]
    }
  }
})

export { Selection }


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