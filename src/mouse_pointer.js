import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { HasObject } from './has_object.js'
import { AwarenessGetsState, AwarenessSetsState } from './network_awareness.js'

const HasSphere = stampit(Component, {
  methods: {
    hideSphere() {
      this.object.remove(this.sphereMesh)
    },
    
    showSphere() {
      this.object.add(this.sphereMesh)
    },

    setup() {
      const geometry = new THREE.SphereGeometry(7)
      const material = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        depthTest: true,
        transparent: true, // so that it shows up on top of images
      })
      this.sphereMesh = new THREE.Mesh(geometry, material)
      this.object.renderOrder = 1
      
      this.showSphere()
    },
  }
})

const UpdatesPositionFromScreenCoords = stampit(Component, {
  init() {
    this.screenCoords = {x: 0, y: 0}
    this.screenVec = new THREE.Vector3()
    this.screenRaycaster = new THREE.Raycaster()
  },

  methods: {
    setScreenCoords(x, y) {
      this.screenCoords = {x, y}
    },

    update(delta) {
      const camera = this.stage.camera
      const mouse = {
        x: (this.screenCoords.x / window.innerWidth) * 2 - 1,
        y: -(this.screenCoords.y / window.innerHeight) * 2 + 1
      }

      this.screenRaycaster.setFromCamera(mouse, camera)
      const intersects = this.screenRaycaster.intersectObject(this.stage.ground)

      if (intersects.length > 0) {
        this.object.position.copy(intersects[0].point)
        // TODO: make this a configurable offset. For now, it puts the HasSphere
        //       object slightly "above" the ground, and above the mouse cursor
        this.object.position.y += 10
        this.object.position.x -= 3
      }

      if (this.state.position.target) {
        this.state.position.target.copy(this.object.position)
      }
    }
  }
})

const MousePointerUpdate = stampit(Component, {
  methods: {
    update(delta) {
      if (!this.state.position.now.equals(this.state.position.target)) {
        this.state.position.now.copy(this.state.position.target)
        this.object.position.copy(this.state.position.now)
      }
    }
  }
})

const MousePointer = stampit(
  Entity,
  HasObject,
  HasSphere,
  UpdatesPositionFromScreenCoords,
  AwarenessGetsState
)

const OtherMousePointer = stampit(
  Entity,
  HasObject,
  HasSphere,
  AwarenessSetsState,
  MousePointerUpdate
)

export {
  MousePointer,
  OtherMousePointer
}