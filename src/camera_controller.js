import stampit from 'stampit'
import { Vector3 } from 'three'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { config } from './config.js'

const CameraController = stampit(Entity, Component, {
  props: {
    targetFar: null,
    targetNear: null,
  },

  init({ target, offsetNear, offsetFar, getRatio }) {
    // We track two 'offsets': one for when the camera is far away ("zoomed out")
    // and one for when the camera is near to the ground ("zoomed in"). We lerp
    // between the two as zoom goes in and out.
    this.target = target
    this.offsetNear = offsetNear || new Vector3().copy(config.CAMERA_NEAR)
    this.offsetFar = offsetFar || new Vector3().copy(config.CAMERA_FAR)
    this.getRatio =
      getRatio ||
      (() => {
        return 0.0
      })

    this.position = new Vector3()
    this.offset = new Vector3()
  },

  methods: {
    setup() {
      this.offset.copy(this.offsetFar)
      this.stage.camera.position.copy(this.offset)
      this.stage.camera.lookAt(0, 0, 0)
    },

    warp(position) {
      this.stage.camera.position.copy(position)
    },

    update(delta) {
      const ratio = this.getRatio()

      this.position.copy(this.target)

      this.offset.copy(this.offsetFar)
      this.offset.lerp(this.offsetNear, ratio)

      this.position.add(this.offset)
      this.stage.camera.position.lerp(this.position, 0.2)
    },
  },
}).setType('camcon')

export { CameraController }
