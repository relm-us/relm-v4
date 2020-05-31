import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { calculateAverageDelta } from './average_delta.js'

import { HasScene } from './has_scene.js'
import { SceneWithCamera } from './scene_with_camera.js'
import { SceneWithRenderer } from './scene_with_renderer.js'
import { SceneWithGround } from './scene_with_ground.js'
import { Selection } from './selection.js'
import { uuidv4 } from './util.js'

const Stage = stampit(
  HasScene,
  SceneWithCamera,
  SceneWithRenderer,
  SceneWithGround,
  EventEmittable,
{
  name: 'Stage',

  props: {
    /**
     * @type {Object}
     */
    entities: null,
    
    /**
     * Width of the stage in pixels (i.e. screen)
     * @type {number}
     */
    width: null,
    
    /**
     * Height of the stage in pixels (i.e. screen)
     * @type {number}
     */
    height: null,
    
    continueRendering: true,
    
    /**
     * Editor Mode allows the user to zoom out more so they can see the whole relm,
     * as well as interact with locked objects.
     */
    editorMode: false,
  },

  init({ width, height }) {
    this.entities = {}
    this.entitiesOnStage = []
    this.selection = Selection({ stage: this })
    this.projScreenMatrix = new THREE.Matrix4()
    this.frustum = new THREE.Frustum()
    this.updateFns = new Map()
    this.postrenderFns = new Map()
    this.gridSnap = null
    if (!width || !height) {
      throw new Error('State requires width and height')
    } else {
      this.width = width
      this.height = height
      this.emit('resize', { width, height })
    }
  },
  
  methods: {
    has(entity) {
      if (!entity.uuid) {
        throw new Error('Entity must have uuid', entity)
      }
      return (entity.uuid in this.entities)
    },

    add(entity) {
      if (!entity.uuid) {
        throw new Error('Entity must have uuid', entity)
      }
      if (entity.uuid in this.entities) {
        console.error(`Entity already on stage, skipping 'add'`, entity)
        return
      }
      this.entities[entity.uuid] = entity
      if (typeof entity.setup === 'function') {
        entity.setup()
      }
    },

    remove(entity) {
      if (typeof entity.teardown === 'function') {
        entity.teardown()
      }
      delete this.entities[entity.uuid]
    },

    forEachEntity(fn) {
      Object.values(this.entities).forEach(fn)
    },
    
    forEachEntityOfType(type, fn, sortFn) {
      const entities = Object.values(this.entities).filter(e => e.type === type)
      if (sortFn) { entities.sort(sortFn) }
      entities.forEach(fn)
    },
    
    forEachEntityOnStageOfType(type, fn, sortFn) {
      const entities = Object.values(this.entitiesOnStage).filter(e => e.type === type)
      if (sortFn) { entities.sort(sortFn) }
      entities.forEach(fn)
    },

    windowResized(w, h) {
      this.width = w
      this.height = h
      this.emit('resize', { width: w, height: h })
    },

    addUpdateFunction(fn) {
      this.updateFns.set(fn, fn)
    },
    
    removeUpdateFunction(fn) {
      this.updateFns.delete(fn)
    },
    
    addPostrenderFunction(fn) {
      this.postrenderFns.set(fn, fn)
    },
    
    removePostrenderFunction(fn) {
      this.postrenderFns.delete(fn)
    },

    allUpdates(delta) {
      // Calculate what is inside the PerspectiveCamera's Frustum, as an optimization
      this.camera.updateMatrix()
      this.camera.updateMatrixWorld()
      this.projScreenMatrix.multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix)
      this.entitiesOnStage.length = 0
      const bbox = new THREE.Box3()
      for (let uuid in this.entities) {
        const entity = this.entities[uuid]
        // Record entities within camera view
        if (entity.object && entity.object.children.length > 0) {
          const child = entity.object.children[0]
          
          bbox.setFromObject(child)
          if (this.frustum.intersectsBox(bbox)) {
            this.entitiesOnStage.push(entity)
          }
        }
      }
      
      for (let uuid in this.entities) {
        const entity = this.entities[uuid]
        // Handle each entity's `update` function
        if (entity.update) {
          entity.update(delta)
        } else {
          console.log('entity has no update', uuid)
        }
      }
      // Additionally handle any special case `update` functions
      this.updateFns.forEach((_, fn) => fn(delta))
    },
    
    allPostrenders() {
      this.postrenderFns.forEach((_, fn) => fn())
    },
    
    stopRendering() {
      this.continueRendering = false
    },
    
    setGridSnap(size) {
      this.gridSnap = size
    },
    
    enableEditorMode() {
      this.editorMode = true
      this.minFov = 20.0
      this.maxFov = 800.0
    },
    
    disableEditorMode() {
      this.editorMode = false
      this.setDefaultFovRange()
    },
    
    /**
     * Main animation loop starts here.
     */
    start() {
      const animate = (nowMsec) => {
        let avgDelta = calculateAverageDelta(nowMsec)

        // render the animation frame for each object by calling each object's update function
        // this.stats.begin()
        this.allUpdates(avgDelta)
        this.render(avgDelta)
        this.allPostrenders()
        // this.stats.end()

        // keep looping
        if (this.continueRendering) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }
})

export { Stage }
