import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { AnimatesPosition } from './components/animates_position.js'
import { ReceivesPointer } from './receives_pointer.js'
import { GlowMaterial } from './materials/glow_material.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { HasLabel } from './components/has_label.js'
import { HasThoughtBubble } from './components/has_thought_bubble.js'
import { defineGoal } from './goals/goal.js'

const HasGlowingDiamond = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      diamond: defineGoal('di', { open: true, text: null })
    }
  },

  methods: {
    _createDiamond() {
      const gltf = this.resources.get('interact')
      this.material = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        transparent: true
      })
      this.geometry = gltf.scene.getObjectByName('Diamond').geometry

      this.diamond = new THREE.Mesh(this.geometry, this.material)
      this.diamond.scale.set(1, 1, 1)
      this.object.add(this.diamond)
    },

    _createGlow() {
      const material = GlowMaterial
      const geometry = new THREE.SphereGeometry(2, 3, 2)

      this.glow = new THREE.Mesh(geometry, material)
      this.glow.scale.set(1.6, 1.6, 1.6)
      this.object.add(this.glow)
    },
    
    _createLight() {
      let light
      
      light = new THREE.SpotLight(0xffff99, 0.2, 0, Math.PI/18)
      this.object.add(light)
      this.object.add(light.target)
    },
    
    _setBoxStyles() {
      // Disable circle form of ThoughtBubble
      this.thoughtBubble.enableCircle = false
      // Disable dot..dot little circles of ThoughtBubble
      this.thoughtBubble.enableDots = false
      this.thoughtBubble.alignCenter = true
    },

    setMessage(text) {
      this.goals.diamond.set('text', text)
    },
    
    onClick() {
      this.goals.diamond.update({ open: !this.goals.diamond.get('open') })
    },
    
    setup() {
      this._createDiamond()
      this._createGlow()
      this._createLight()
      
      this.object.scale.set(5, 15, 5)
      this.orbit = 0
    },

    update(delta) {
      this.orbit += Math.PI * delta
      this.diamond.rotation.y -= Math.PI/2 * delta
      this.diamond.scale.x = 1.0 + Math.sin(this.orbit) * 0.2
      this.diamond.scale.y = 1.0 + Math.sin(this.orbit) * 0.2
      // this.object.rotation.y += Math.PI/2 * delta

      const diamondGoal = this.goals.diamond
      if (!diamondGoal.achieved) {
        this._setBoxStyles()
        if (diamondGoal.get('open')) {
          this.setThought(diamondGoal.get('text'))
        } else {
          this.setThought(null)
        }
        diamondGoal.markAchieved()
      }
    }
  }
})

const DiamondIndicator = stampit(
  EntityShared,
  HasObject,
  AnimatesPosition,
  HasGlowingDiamond,
  HasEmissiveMaterial,
  ReceivesPointer,
  HasLabel,
  HasThoughtBubble,
  stampit({
    init() {
      this.thoughtBubbleOffset = { x: 0, y: 50 }
      this.thoughtBubble.enableCloseIcon = false
      this.thoughtBubble.enableActionIcon = false
    }
  })
).setType('diamond')

export { DiamondIndicator }