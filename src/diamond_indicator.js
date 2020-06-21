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

const DIAMOND_LIGHT_COLOR = 0xFFF5D9

const HasGlowingDiamond = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      diamond: defineGoal('di', { open: true, text: null })
    }
  },
  
  init() {
    this._lightCircleLayer = Math.floor(Math.random() * 100)
    this.on('position-changed', () => {
      this._createLightCircle(this.object.position.y)
    })
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
      this.diamond.scale.set(8, 8, 8)
      this.object.add(this.diamond)
    },

    _createGlow() {
      const material = GlowMaterial
      const geometry = new THREE.SphereGeometry(2, 3, 2)

      this.glow = new THREE.Mesh(geometry, material)
      this.glow.scale.set(8, 24, 8)
      this.object.add(this.glow)
    },
    
    // Fake light is a lot faster to render than real light
    _createLightCircle(height) {
      if (this._lightCircle) { this.object.remove(this._lightCircle) }
      
      const radius = height / 4
      
      const geometry = new THREE.CircleBufferGeometry(radius, 48)
      
      if (!this._lightCircleMaterial) {
        this._lightCircleMaterial = new THREE.MeshStandardMaterial({
          color: DIAMOND_LIGHT_COLOR,
          transparent: true,
          blending: THREE.AdditiveBlending,
        })
      }
      
      this._lightCircle = new THREE.Mesh(geometry, this._lightCircleMaterial)
      this._lightCircle.renderOrder = this._lightCircleLayer
      this._lightCircle.rotation.x = -Math.PI/2
      this._lightCircle.position.y = -height + this._lightCircleLayer / 100

      this.object.add(this._lightCircle)
      
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
      
      this.orbit = 0
    },

    update(delta) {
      this.orbit += Math.PI * delta
      this.diamond.rotation.y -= Math.PI/2 * delta
      this.diamond.scale.x = 8.0 + Math.sin(this.orbit) * 3
      this.diamond.scale.y = 12.0 + Math.sin(this.orbit) * 3

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
    },
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