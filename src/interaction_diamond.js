import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { HasObject } from './has_object.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'
import { GlowMaterial } from './glow_material.js'
import { HasEmissiveMaterial } from './has_emissive_material.js'
import { CanUiLock } from './can_ui_lock.js'

/*
*/
const HasGlowingDiamond = stampit(Component, {
  deepProps: {
    state: {
      link: {
        now: null,
        target: null
      }
    }
  },

  init({ link }) {
    if (link) {
      this.state.link.now = this.state.link.target = link
    }
  },

  methods: {
    createDiamond() {
      const gltf = this.resources.get('interact')
      console.log('interact gltf', gltf)
      this.material = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        transparent: true
      })
      this.geometry = gltf.scene.getObjectByName('Diamond').geometry

      this.diamond = new THREE.Mesh(this.geometry, this.material)
      this.diamond.scale.set(1, 1, 1)
      this.object.add(this.diamond)
    },

    createGlow() {
      const gltf = this.resources.get('interact')
      const material = GlowMaterial
      // const geometry = gltf.scene.getObjectByName('Diamond').geometry
      const geometry = new THREE.SphereGeometry(2, 3, 2)

      this.glow = new THREE.Mesh(geometry, material)
      this.glow.scale.set(1.6, 1.6, 1.6)
      this.object.add(this.glow)
    },
    
    createLight() {
      const light = new THREE.PointLight(0xffdd44, 0.4, 1000, 2)
      // light.position.set(0, 1, 0)
      this.object.add(light)
    },
    
    onClick() {
      const link = this.state.link.now
      if (link && link.match(/^http(s):/)) {
        window.open(link, '_blank')
      }
    },
    
    setup() {
      this.createDiamond()
      this.createGlow()
      this.createLight()
      
      // this.object.rotation.x = -Math.PI/4
      this.object.scale.set(5, 15, 5)
      this.orbit = 0
    },

    update(delta) {
      this.orbit += Math.PI * delta
      this.diamond.rotation.y -= Math.PI/2 * delta
      this.diamond.scale.x = 1.0 + Math.sin(this.orbit) * 0.2
      this.diamond.scale.y = 1.0 + Math.sin(this.orbit) * 0.2
      this.object.rotation.y += Math.PI/2 * delta
    }
  }
})

const InteractionDiamond = stampit(
  Entity,
  HasObject,
  HasGlowingDiamond,
  HasEmissiveMaterial,
  CanUiLock,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState
)

export { InteractionDiamond }