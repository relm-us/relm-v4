import stampit from 'stampit'
import { Vector3 } from 'three'

import { difference, intersection } from './util.js'

const Selection = stampit({
  props: {
    selected: null,
  },

  init({ stage }) {
    this.stage = stage
    this.selected = new Set()
    this.savedPositions = new Map()
    this._clipboard = []
  },

  methods: {
    getAllEntities() {
      return Array.from(this.selected)
    },

    copy() {
      this._clipboard = this.getAllEntities().map((entity) => {
        return {
          id: entity.uuid,
          type: entity.type,
          desc: entity.goals.toDesc(),
        }
      })
    },

    paste(networkDocument, { x, y, z }) {
      this.clearSelection()
      const center = this._getCenter(this._clipboard)

      this._clipboard.forEach(({ id, type, desc }) => {
        desc.position.x = x + (desc.position.x - center.x)
        desc.position.y = y + (desc.position.y - center.y)
        desc.position.z = z + (desc.position.z - center.z)
        networkDocument.create({
          type,
          goals: desc,
          after: (entity) => {
            entity.once('mesh-updated', () => {
              this.select([entity], '+')
            })
          },
        })
      })
    },

    _getCenter(entities) {
      let center = { x: 0, y: 0, z: 0 }
      const size = this._clipboard.length
      entities.forEach(({ id, type, desc }) => {
        center.x += desc.position.x
        center.y += desc.position.y
        center.z += desc.position.z
      })
      center.x /= size
      center.y /= size
      center.z /= size

      return center
    },

    count() {
      return this.selected.size
    },

    clearSelection() {
      this.select([], '=')
    },

    addSelection(entitiesSet) {
      const added = difference(entitiesSet, this.selected)
      entitiesSet.forEach((entity) => this.selected.add(entity))

      added.forEach((entity) => {
        entity.emit('select')
      })

      return added
    },

    removeSelection(entitiesSet) {
      const removed = intersection(entitiesSet, this.selected)
      entitiesSet.forEach((entity) => this.selected.delete(entity))

      removed.forEach((entity) => {
        entity.emit('deselect')
      })

      return removed
    },

    has(entity) {
      return this.selected.has(entity)
    },

    /**
     * Selects an array of entities, either by addition, subtraction, or by replacing.
     *
     * @param {Array<Entity>} entities
     * @param {string} setOperation One of '+', '-', or '='
     */
    select(entities, setOperation = '=') {
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
        default:
          new Error(
            `Only '+', '-' and null are accepted as set operations for selection`
          )
      }
    },

    forEach(callback) {
      this.selected.forEach(callback)
    },

    savePositions(id) {
      this.savedPositions[id] = new Map()
      this.selected.forEach((entity) => {
        const position = new Vector3()
        position.copy(entity.object.position)
        this.savedPositions[id][entity.uuid] = position
      })
    },

    savedPositionFor(id, entity) {
      return this.savedPositions[id][entity.uuid]
    },
  },
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
      if (
        previouslyWouldSelectObject &&
        wouldSelectObject !== previouslyWouldSelectObject
      ) {
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
