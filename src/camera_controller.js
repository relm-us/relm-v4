import stampit from 'stampit'
import { Component } from './component.js'
import { Entity } from './entity.js'

const { Vector3 } = THREE

const CameraController = stampit(Entity, Component, {
  props: {
    target: null
  },

  init({ target }) {
    this.target = target
    this.offset = new Vector3()
    this.position = new Vector3()
  },

  methods: {
    setup() {
      this.offset.copy(this.stage.camera.position)
    },

    update(delta) {
      // console.log('CameraController update')
      this.position.copy(this.target.object.position)
      this.position.add(this.offset)
      this.stage.camera.position.copy(this.position)
    }
  }
})

export { CameraController }
