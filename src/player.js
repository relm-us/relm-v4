import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasLabel } from './components/has_label.js'
// import { UpdatesLabelToUniqueColor } from './components/updates_label_to_unique_color.js'
import { FollowsTarget } from './components/follows_target.js'
import { HasAnimationMixer } from './components/has_animation_mixer.js'
import { WalksWhenMoving } from './components/walks_when_moving.js'
import { HasThoughtBubble } from './components/has_thought_bubble.js'
import { HasVideoBubble } from './components/has_video_bubble.js'
import { HasOpacity } from './components/has_opacity.js'
import { HasOffscreenIndicator } from './components/has_offscreen_indicator.js'
import { LocalstoreGetsState } from './localstore_gets_state.js'
import { AnimatesPosition } from './components/animates_position.js'
import { AnimatesRotation } from './components/animates_rotation.js'
import { defineGoal } from './goals/goal.js'

const HasMaxSpeed = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      speed: defineGoal('spd', { max: 250 })
    }
  },
  
  methods: {
    setSpeed(speed) {
      this.goals.speed.update({ max: speed })
    },

    _getPositionLerpAlpha(distance, delta) {
      const speed = this.goals.speed.get('max')
      if (speed === undefined) {
        throw Error('speed is undefined')
      }
      const alpha = speed * delta / distance
      return THREE.MathUtils.clamp(alpha, 0.00001, 0.5)
    }
  }
})

const FOLLOW_TARGET_DISTANCE_AHEAD = 100.0
const FOLLOW_TARGET_SUFFICIENT_TIME = 2000.0

const FollowsTarget2 = stampit(Component, {
  init() {
    // this.addGoal('p', { x: 0.0, y: 0.0, z: 0.0 })

    this.closeEnough = 1.0
    this._source = new THREE.Object3D()
    this._target = new THREE.Object3D()
    this._goalPos = new THREE.Object3D()
  },

  methods: {
    addPosition(vector) {
      this._target.position.add(vector)
    },
    
    getDistanceToTarget() {
      this._goalPos.position.copy(this.goals.position.toJSON())
      const distance = this.object.position.distanceTo(this._goalPos.position)
      return distance
    },

    update(delta) {
      this._goalPos.position.copy(this.goals.position.toJSON())
      
      // console.log('obj pos', this.object.position)
      this._source.position.copy(this.object.position)
      this._source.rotation.copy(this.object.rotation)
      
      this._target.position.normalize()
      this._target.position.multiplyScalar(FOLLOW_TARGET_DISTANCE_AHEAD)
      this._target.position.add(this._source.position)
      
      const dueAt = Date.now() + FOLLOW_TARGET_SUFFICIENT_TIME
      const goalToTargetDist = this._goalPos.position.distanceTo(this._target.position)
      if (goalToTargetDist > FOLLOW_TARGET_DISTANCE_AHEAD/2) {
        this.goals.position.update({
          x: this._target.position.x,
          y: this._target.position.y,
          z: this._target.position.z,
        }, dueAt)
        
      }
      
      this._source.lookAt(this._target.position)
      const dist = this._source.position.distanceTo(this._target.position)
      if (dist > this.closeEnough) {
        this.goals.rotation.update({
          x: this._source.rotation.x,
          y: this._source.rotation.y,
          z: this._source.rotation.z,
        }, dueAt)
      }
      
      this._target.position.set(0, 0, 0)
    }
  }
})


const Player = stampit(
  EntityShared,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  AnimatesPosition,
  AnimatesRotation,
  HasAnimationMixer,
  WalksWhenMoving,
  // UpdatesLabelToUniqueColor,
  HasMaxSpeed,
  FollowsTarget2,
  // HasOffscreenIndicator,
  LocalstoreGetsState,
  stampit(Component, {
    deepStatics: {
      goalDefinitions: {
        color: defineGoal('clr', { r: 1.0, g: 1.0, b: 1.0 })
      }
    },

    init() {
      this.videoBubble.offset = new THREE.Vector3(0, 190, 0)
    }
  })
).setType('player')

export {
  Player,
}