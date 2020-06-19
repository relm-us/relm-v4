import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { FindIntersectionsFromScreenCoords } from './find_intersections_from_screen_coords.js'
import { defineGoal } from './goals/goal.js'

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
  EntityShared,
  HasObject,
  HasSphere,
  HasRing,
  stampit(Component, {
    deepStatics: {
      goalDefinitions: {
        'color': defineGoal('clr', { r: 1.0, g: 1.0, b: 1.0 }),
        'position': defineGoal('p', { x: 0, y: 0, z: 0 }),
      }
    },

    init() {
      this._finder = 
        FindIntersectionsFromScreenCoords({ stage: this.stage })
      this._screenCoords = new Map()
    },

    methods: {
      setScreenCoords(x, y) {
        const point = this._finder.getFirstIntersectionPoint(x, y)
        
        if (point) {
          this._screenCoords.set('x', point.x - 3)
          this._screenCoords.set('y', point.y + 10)
          this._screenCoords.set('z', point.z + 10)

          if (!this.goals.position.equals(this._screenCoords)) {
            // As long as mouse intersected with something (even the ground), set the new goal
            this.goals.position.update({
              x: this._screenCoords.get('x'),
              y: this._screenCoords.get('y'),
              z: this._screenCoords.get('z'),
            })
          }
        }
      },
      
      update(delta) {
        const colorGoal = this.goals.color
        if (!colorGoal.achieved) {
          this.setRingColor(new THREE.Color(
            colorGoal.get('r'),
            colorGoal.get('g'),
            colorGoal.get('b'),
          ))
          colorGoal.markAchieved()
        }
        
        const positionGoal = this.goals.position
        if (!positionGoal.achieved) {
          this.object.position.copy(positionGoal.toJSON())
          positionGoal.markAchieved()
        }
      }
    }
  })
).setType('mouse')

export {
  MousePointer,
}