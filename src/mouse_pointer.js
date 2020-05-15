import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { HasObject } from './has_object.js'
import { AwarenessGetsState, AwarenessSetsState } from './network_awareness.js'

/**
 * Look for the Entity that owns an object, given that the object might be
 * a leaf in the scene graph.
 * 
 * @param {Array<Entity>} entities 
 * @param {Object3D} object 
 */
function findEntityForObject(entities, object) {
  if (!object.parent) {
    return null
  }
  
  let o = object
  // Entities that `HasObject` always have a 'dummy' object that contains
  // the real object, so we check for grandparent being null rather than parent
  while (o.parent.parent) {
    o = o.parent
  }
  
  for (let entity of entities) {
    if (entity.object == o) {
      return entity
    }
  }
  
  return null
}

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
    this.intersects = []
  },

  methods: {
    setScreenCoords(x, y) {
      this.screenCoords = {x, y}
    },
    
    getMouseCoords() {
      return {
        x: (this.screenCoords.x / window.innerWidth) * 2 - 1,
        y: -(this.screenCoords.y / window.innerHeight) * 2 + 1
      }
    },

    getIntersectsGround() {
      this.screenRaycaster.setFromCamera(this.getMouseCoords(), this.stage.camera)
      return this.screenRaycaster.intersectObject(this.stage.ground)
    },
    
    getIntersects() {
      this.screenRaycaster.setFromCamera(this.getMouseCoords(), this.stage.camera)
      // This `reduce` is equivalent to a `.map` and a `.filter`, combined for speed
      const objects = this.stage.entitiesOnStage.reduce((accum, entity) => {
        if (entity.receivesPointer) {
          accum.push(entity.object)
        }
        return accum
      }, [])
      objects.push(this.stage.ground)
      
      // Reduce length to zero rather than garbage collect (speed optimization)
      this.intersects.length = 0
      this.screenRaycaster.intersectObjects(objects, true, this.intersects)

      // console.log('intersects', this.intersects)
      this.intersects.forEach((intersection) => {
        const entity = findEntityForObject(this.stage.entitiesOnStage, intersection.object)
        intersection.entity = entity
      })
      
      return this.intersects
    },

    update(delta) {
      this.getIntersects()

      if (this.intersects.length > 0) {
        const ip = this.intersects[0].point
        const mp = this.object.position
        // TODO: make this a configurable offset. For now, it puts the HasSphere
        //       object slightly "above" the ground, and above the mouse cursor
        mp.x = ip.x - 3
        mp.y = ip.y + 10
        mp.z = ip.z + 10
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