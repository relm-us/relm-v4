import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { calculateAverageDelta } from './average_delta.js'

import { HasScene } from './has_scene.js'
import { SceneWithCamera } from './scene_with_camera.js'
import { SceneWithRenderer } from './scene_with_renderer.js'
import { SceneWithGround } from './scene_with_ground.js'

const Stage = stampit(
  HasScene,
  SceneWithCamera,
  SceneWithRenderer,
  SceneWithGround,
  EventEmittable,
{
  name: 'Stage',

  props: {
    entities: {},
    width: null,
    height: null,
  },

  init({ width, height }) {
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

    windowResized(w, h) {
      this.width = w
      this.height = h
      this.emit('resize', { width: w, height: h })
    },

    update(delta) {
      for (let uuid in this.entities) {
        const entity = this.entities[uuid]
        entity.update(delta)
      }
    },
    
    start() {
      const animate = (nowMsec) => {
        let avgDelta = calculateAverageDelta(nowMsec)

        // render the animation frame for each object by calling each object's update function
        // this.stats.begin()
        this.update(avgDelta)
        this.render(avgDelta)
        // this.stats.end()

        // keep looping
        requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }
  }
})

export { Stage }
