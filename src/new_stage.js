import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { calculateAverageDelta } from './average_delta.js'

import { HasScene } from './has_scene.js'
import { SceneWithCamera } from './scene_with_camera.js'
import { SceneWithRenderer } from './scene_with_renderer.js'
import { SceneWithGround } from './scene_with_ground.js'
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
  },

  init({ width, height }) {
    this.entities = {}
    this.updateFns = {}
    if (!width || !height) {
      throw new Error('State requires width and height')
    } else {
      this.width = width
      this.height = height
      this.emit('resize', { width, height })
    }
  },
  
  methods: {
    add(entity) {
      if (!entity.uuid) {
        throw new Error('Entity must have uuid', entity)
      }
      this.entities[entity.uuid] = entity
      if (typeof entity.setup === 'function') {
        entity.setup()
      }
    },

    remove(entity) {
      if (typeof entity.setup === 'function') {
        entity.teardown()
      }
      delete this.entities[entity.uuid]
    },
    
    forEachEntityOfType(type, fn, sortFn) {
      const entities = Object.values(this.entities).filter(e => e.type === type)
      if (sortFn) { entities.sort(sortFn) }
      entities.forEach(fn)
    },

    windowResized(w, h) {
      this.width = w
      this.height = h
      this.emit('resize', { width: w, height: h })
    },

    addUpdateFunction(fn) {
      const id = uuidv4()
      this.updateFns[id] = fn
      return id
    },

    update(delta) {
      // Handle each entity's `update` function
      for (let uuid in this.entities) {
        const entity = this.entities[uuid]
        if (entity.update) {
          entity.update(delta)
        }
      }
      // Additionally handle any special case `update` functions
      for (let uuid in this.updateFns) {
        this.updateFns[uuid](delta)
      }
    },
    
    stopRendering() {
      this.continueRendering = false
    },
    
    /**
     * Main animation loop starts here.
     */
    start() {
      const animate = (nowMsec) => {
        let avgDelta = calculateAverageDelta(nowMsec)

        // render the animation frame for each object by calling each object's update function
        // this.stats.begin()
        this.update(avgDelta)
        this.render(avgDelta)
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
