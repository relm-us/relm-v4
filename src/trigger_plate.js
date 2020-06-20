import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { AnimatesPosition } from './components/animates_position.js'
import { AnimatesScale } from './components/animates_scale.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { defineGoal } from './goals/goal.js'
import { importRelm } from './export.js'

const { Mesh, MeshStandardMaterial, DoubleSide, Color } = THREE

const TRIGGER_COLOR = new Color(0x222)
const TRIGGER_SIZE = 50

const Triggers = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      trigger: defineGoal('trig', { json: null })
    }
  },

  init({ target }) {
    this.setTarget(target)

    this.active = false
    this.oneTimeTrigger = false
  },

  methods: {
    _createMesh() {
      if (this.mesh) {
        this.object.remove(this.mesh)
      }
      const geometry = new THREE.PlaneBufferGeometry(TRIGGER_SIZE, TRIGGER_SIZE)
      const material = this.material = new MeshStandardMaterial({
        color: TRIGGER_COLOR,
        side: DoubleSide,
      })
      this.mesh = new Mesh(geometry, material)
      this.mesh.position.y = 1
      this.mesh.rotation.x = -Math.PI * 0.5
      
      this.object.add(this.mesh)
    },
    
    setTarget(target) {
      this.target = target
      
      if (target) {
        if (!target.setOpacity) { throw Error('Teleportal target must have .setOpacity') }
        if (!target.addPosition) { throw Error('Teleportal target must have .addPosition') }
      }
    },
    
    setActive() {
      this.active = true
    },

    setInactive() {
      this.active = false
    },
    
    _triggerAction() {
      if (!this.goals.trigger.get('json')) return
      const json = JSON.parse(this.goals.trigger.get('json'))
      importRelm(this.network, json)
    },
    
    update(delta) {
      // TriggerPlate tracks the player as the entity that can trigger.
      if (!this.target && this.stage.player) {
        this.setTarget(this.stage.player)
      }
      
      const trigGoal = this.goals.trigger
      if (!trigGoal.achieved) {
        this._createMesh()
        trigGoal.markAchieved()
      }
      
      // Skip processing if we don't have a target to which we can calculate distance
      if (!this.target) {
        return
      }
      
      const size = TRIGGER_SIZE * this.goals.scale.get('x')
      const distance = this.object.position.distanceTo(this.target.object.position)
      if (distance < size) {
        if (this.active) {
          this._triggerAction()
          this.setInactive()
        }
      } else if (!this.active && distance > size + 20) {
        // Enable trigger when player is "outside" the zone
        this.setActive()
      }
    }
  }
})

const TriggerPlate = stampit(
  EntityShared,
  HasObject,
  AnimatesPosition,
  AnimatesScale,
  ReceivesPointer,
  Triggers,
  HasEmissiveMaterial
).setType('trigger')

export { TriggerPlate }