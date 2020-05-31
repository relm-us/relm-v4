import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { FollowsTarget } from './components/follows_target.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
// import { NetworkSetsState } from './network_persistence.js'

const { RingGeometry, Mesh, MeshStandardMaterial, DoubleSide, Color } = THREE

const ACTIVE_COLOR = new Color(0xF380F4)
const INACTIVE_COLOR = new Color(0x444444)

const Teleports = stampit(Component, {
  props: {
    target: null,
    active: true,
  },
  
  deepProps: {
    state: {
      radius: {
        now: 150,
        target: 150,
      },
      url: {
        now: null,
        target: null,
      }
    }
  },

  init({
    active = this.active,
    target = this.target,
    radius,
    url
  }) {
    this.active = active
    
    if (target) {
      this.target = target
    } else {
      console.error('Teleportal target cannot be null (did you mean to target the player?)')
    }
    
    if (radius) {
      this.state.radius.now = radius
      this.state.radius.target = radius
    }
    
    if (url) {
      this.state.url.target = url
    } else {
      console.warn('Teleportal has no url', this.uuid)
    }
    
    this.oneTimeTrigger = false
  },

  methods: {
    createTeleportalRing() {
      if (this.ring) {
        this.object.remove(this.ring)
      }
      const radius = this.state.radius.now
      console.log('createTeleportalRing', radius)
      const geometry = new RingGeometry(0, radius + 5.0, 64, 6)
      const material = this.material = new MeshStandardMaterial({
        // color: (this.active ? ACTIVE_COLOR : INACTIVE_COLOR),
        color: INACTIVE_COLOR,
        side: DoubleSide,
      })
      this.ring = new Mesh(geometry, material)
      this.ring.position.y = 1
      this.ring.rotation.x = -Math.PI * 0.5
      
      this.object.add(this.ring)
    },
    
    setRadius(r) {
      this.state.radius.target = r
    },
    
    setActive() {
      this.active = true
      if (this.material) {
        // Don't show active state for now
        // this.material.color = ACTIVE_COLOR
      }
    },

    setInactive() {
      this.active = false
      if (this.material) {
        this.material.color = INACTIVE_COLOR
      }
    },

    setup() {
      this.createTeleportalRing()
    },

    update(delta) {
      if (this.state.radius.now !== this.state.radius.target) {
        this.state.radius.now = this.state.radius.target
        this.createTeleportalRing()
      }
      
      if (this.state.url.now !== this.state.url.target) {
        this.state.url.now = this.state.url.target
      }
      
      const radius = this.state.radius.now

      const distance = this.object.position.distanceTo(this.target.object.position)
      if (distance < radius / 3) {
        if (this.active) {
          const url = this.state.url.now
          if (url && url.indexOf('http') === 0) {
            if (!this.oneTimeTrigger) {
              this.target.disableFollowsTarget()
              this.oneTimeTrigger = true
              setTimeout(() => {
                // Teleport!
                window.location = url
              }, 200)
            } else {
              this.target.object.position.lerp(this.object.position, 0.3)
              this.target.object.rotation.y += 0.5
            }
          }
        }
      } else if (distance < radius) {
        if (this.active) {
          this.target.setOpacity(distance / radius)
        }
      } else if (distance < radius + 20) {
        this.target.setOpacity(1.0)
        this.setActive()
      }
    }
  }
})

const Teleportal = stampit(
  Entity,
  HasObject,
  FollowsTarget,
  ReceivesPointer,
  // NetworkSetsState,
  Teleports,
  HasEmissiveMaterial
)

export { Teleportal }