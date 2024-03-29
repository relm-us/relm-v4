import stampit from 'stampit'
import {
  Vector3,
  Color,
  Mesh,
  MeshStandardMaterial,
  CircleGeometry,
  // Constants
  DoubleSide,
} from 'three'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { AnimatesPosition } from './components/animates_position.js'
import { AnimatesScale } from './components/animates_scale.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { req } from './util.js'
import { defineGoal } from './goals/goal.js'

const PORTAL_COLOR = new Color(0x444444)
const PORTAL_RADIUS = 50

function teleportToOtherRelm({ relm, x = null, y = null, z = null }) {
  let url = window.location.origin + '/' + relm
  if (x !== null && z !== null) {
    url += `?x=${parseFloat(x)}&z=${parseFloat(z)}`
  }
  setTimeout(() => {
    window.location = url
  }, 200)
}

const Teleports = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      portal: defineGoal('prt', {
        relm: null,
        dx: 0.0,
        dy: 0.0,
        dz: 0.0,
      }),
    },
  },

  init({ target }) {
    this.setTarget(target)

    this.active = false
    this.oneTimeTrigger = false
  },

  methods: {
    _createTeleportalMesh() {
      if (this.mesh) {
        this.object.remove(this.mesh)
      }
      const geometry = new CircleGeometry(PORTAL_RADIUS, 32)
      const material = (this.material = new MeshStandardMaterial({
        color: PORTAL_COLOR,
        side: DoubleSide,
      }))
      this.mesh = new Mesh(geometry, material)
      this.mesh.position.y = 1
      this.mesh.rotation.x = -Math.PI * 0.5

      this.object.add(this.mesh)

      this.emit('mesh-updated')
    },

    setTarget(target) {
      this.target = target

      if (target) {
        if (!target.setOpacity) {
          throw Error('Teleportal target must have .setOpacity')
        }
        if (!target.addPosition) {
          throw Error('Teleportal target must have .addPosition')
        }
      }
    },

    setActive() {
      this.active = true
    },

    setInactive() {
      this.active = false
    },

    _isLocalTeleport() {
      return !this.goals.portal.get('relm')
    },

    update(delta) {
      // Default behavior of Teleportal is to track the player as the entity that can teleport.
      // This is a bit of a workaround, implemented this way because the player and teleportals
      // can load in any order. Therefore, we use the global 'stage' and if the player entity
      // is set there, we use it.
      if (!this.target && this.stage.player) {
        this.setTarget(this.stage.player)
      }

      const portalGoal = this.goals.portal
      if (!portalGoal.achieved) {
        this._createTeleportalMesh()
        portalGoal.markAchieved()
      }

      // Skip processing if we don't have a target to which we can calculate distance
      if (!this.target) {
        return
      }

      const radius = PORTAL_RADIUS * this.goals.scale.get('x')
      const distance = this.object.position.distanceTo(
        this.target.object.position
      )
      if (distance < 15) {
        if (this.active) {
          if (this._isLocalTeleport()) {
            this.target.setOpacity(1.0)
            this.target.goals.position.update(
              {
                x: portalGoal.get('dx'),
                y: portalGoal.get('dy'),
                z: portalGoal.get('dz'),
              },
              0
            )
          } else {
            this.setInactive()
            teleportToOtherRelm({
              relm: portalGoal.get('relm'),
              x: portalGoal.get('dx'),
              y: portalGoal.get('dy'),
              z: portalGoal.get('dz'),
            })
          }
        }
      } else if (distance < radius) {
        if (this.active) {
          this.target.setOpacity(distance / radius)

          const vectorToward = new Vector3()
          vectorToward.copy(this.object.position)
          vectorToward.sub(this.target.object.position)

          this.target.addPosition(vectorToward)
        }
      } else if (distance < radius + 20) {
        // Enable portal when player is "outside" the portal
        this.target.setOpacity(1.0)
        this.setActive()
      }
    },
  },
})

const Teleportal = stampit(
  EntityShared,
  HasObject,
  AnimatesPosition,
  AnimatesScale,
  ReceivesPointer,
  Teleports,
  HasEmissiveMaterial
).setType('teleportal')

export { Teleportal, teleportToOtherRelm }
