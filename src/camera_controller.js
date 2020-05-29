import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'

const { Vector3 } = THREE

const CameraController = stampit(Entity, Component, {
  props: {
    targetFar: null,
    targetNear: null,
  },

  init({ targetFar, targetNear }) {
    // We track two 'targets': one for when the camera is far away ("zoomed out")
    // and one for when the camera is near to the ground ("zoomed in"). We lerp
    // between the two as zoom goes in and out.
    this.targetFar = targetFar
    this.targetNear = targetNear
    
    this.offset = new Vector3()
    this.position = new Vector3()
  },

  methods: {
    setup() {
      this.offset.copy(this.stage.camera.position)
    },
    
    warp(position) {
      this.stage.camera.position.copy(position)
    },

    update(delta) {
      const fovRatio = this.stage.getFovRatio()
      
      this.position.copy(this.targetFar)
      if (fovRatio > 0.75) {
        this.position.lerp(this.targetNear, fovRatio)
      }
      this.position.add(this.offset)
      
      if (Number.isNaN(this.stage.camera.position.x)) {
        this.stage.camera.position.copy(this.position)
      } else {
        this.stage.camera.position.lerp(this.position, 0.1)
      }
    }
  }
})

export { CameraController }
