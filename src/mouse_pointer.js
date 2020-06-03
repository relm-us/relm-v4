import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
// import { HasUniqueColor, CopiesUniqueColor } from './components/has_unique_color.js'
import { FindIntersectionsFromScreenCoords } from './find_intersections_from_screen_coords.js'
import { AnimatesPosition } from './components/animates_position.js'
import { GoalOriented, Permanence } from './goals/goal.js'


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
        color: 0xffffff,
        depthTest: true,
        transparent: true, // so that it shows up on top of images
      })
      this.sphereMesh = new THREE.Mesh(geometry, material)
      this.object.renderOrder = 1
      
      this.showSphere()
    },
  }
})


const HasRing = stampit(Component, {
  methods: {
    hideRing() {
      this.object.remove(this.ringMesh)
    },

    showRing() {
      this.object.add(this.ringMesh)
    },

    setup() {
      const ringThickness = 10
      const radius = 7
      const geometry = new THREE.RingGeometry(
        radius - ringThickness/2,
        radius + ringThickness/2,
        32,
        6
      )
      const material = this.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xFFFFFF),
        side: THREE.DoubleSide,
      })
      this.ringMesh = new THREE.Mesh(geometry, material)
      this.ringMesh.rotation.x = -Math.PI * 0.2
      
      this.showRing()
    },
    
    setRingColor(color) {
      this.material.color = color
    },

  }
})


const MousePointer = stampit(
  Entity,
  HasObject,
  HasSphere,
  HasRing,
  // HasUniqueColor,
  GoalOriented,
  stampit(Component, {
    props: {
      permanence: Permanence.TRANSIENT
    },

    init() {
      this.addGoal('uniqcolor', { r: 1.0, g: 1.0, b: 1.0 })
      this.addGoal('p', {x: 0.0, y: 0.0, z: 0.0 })
      
      this._finder = 
        FindIntersectionsFromScreenCoords({ stage: this.stage })
    },

    methods: {
      setScreenCoords(x, y) {
        const point = this._finder.getFirstIntersectionPoint(x, y)
        if (point) {
          // As long as mouse intersected with something (even the ground), set the new goal
          // console.log('setting p', this.uuid)
          this.setGoal('p', {
            x: point.x - 3,
            y: point.y + 10,
            z: point.z + 10,
          })
        }
      },
      
      update(delta) {
        const uniqueColorGoal = this.goals.uniqcolor
        if (!uniqueColorGoal.achieved) {
          const color = uniqueColorGoal.get()
          this.setRingColor(new THREE.Color(color.r, color.g, color.b))
          uniqueColorGoal.markAchieved()
        }
        
        const positionGoal = this.goals.p
        if (!positionGoal.achieved) {
          this.object.position.copy(positionGoal.get())
          positionGoal.markAchieved()
        }
      }
    }
  })
).setType('mouse')

export {
  MousePointer,
}