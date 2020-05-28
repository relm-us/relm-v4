import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './component.js'
import { HasObject } from './has_object.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'
import { GlowMaterial } from './glow_material.js'
import { HasEmissiveMaterial } from './has_emissive_material.js'
import { HasLabel } from './has_label.js'
import { HasThoughtBubble } from './has_thought_bubble.js'

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
      const material = GlowMaterial
      const geometry = new THREE.SphereGeometry(2, 3, 2)

      this.glow = new THREE.Mesh(geometry, material)
      this.glow.scale.set(1.6, 1.6, 1.6)
      this.object.add(this.glow)
    },
    
    createLight() {
      let light
      
      // light = new THREE.PointLight(0xffffff, 0.8, 4000, 2)
      // light.position.y = 20
      // this.object.add(light)
      
      light = new THREE.SpotLight(0xffff99, 0.2, 0, Math.PI/18)
      this.object.add(light)
      this.object.add(light.target)
    },

    setMessage(text) {
      this.state.link.target = text
    },
    
    onClick() {
      // Disable circle form of ThoughtBubble
      this.thoughtBubble.enableCircle = false
      // Disable dot..dot little circles of ThoughtBubble
      this.thoughtBubble.enableDots = false
      this.thoughtBubble.alignCenter = true
      
      if (this.hasThought()) {
        this.setThought(null)
      } else {
        this.setThought(this.state.link.now)
      }
    },
    
    setup() {
      this.createDiamond()
      this.createGlow()
      this.createLight()
      
      this.object.scale.set(5, 15, 5)
      this.orbit = 0
    },

    update(delta) {
      this.orbit += Math.PI * delta
      this.diamond.rotation.y -= Math.PI/2 * delta
      this.diamond.scale.x = 1.0 + Math.sin(this.orbit) * 0.2
      this.diamond.scale.y = 1.0 + Math.sin(this.orbit) * 0.2
      // this.object.rotation.y += Math.PI/2 * delta

      if (this.state.link.now != this.state.link.target) {
        this.state.link.now = this.state.link.target
      }
    }
  }
})

const InteractionDiamond = stampit(
  Entity,
  HasObject,
  HasGlowingDiamond,
  HasEmissiveMaterial,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState,
  HasLabel,
  HasThoughtBubble,
  stampit({
    init() {
      this.labelOffset = { x: 0, y: -70, z: 0 }
      this.thoughtBubbleOffset = { x: 0, y: 50 }
      this.thoughtBubble.enableCloseIcon = false
      this.thoughtBubble.enableActionIcon = false
    }
  })
)

export { InteractionDiamond }