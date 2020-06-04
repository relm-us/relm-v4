import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasLabel } from './components/has_label.js'
// import { HasUniqueColor } from './components/has_unique_color.js'
// import { UpdatesLabelToUniqueColor } from './components/updates_label_to_unique_color.js'
import { FollowsTarget } from './components/follows_target.js'
import { HasAnimationMixer } from './components/has_animation_mixer.js'
import { WalksWhenMoving } from './components/walks_when_moving.js'
import { HasThoughtBubble } from './components/has_thought_bubble.js'
import { HasVideoBubble } from './components/has_video_bubble.js'
import { HasOpacity } from './components/has_opacity.js'
import { HasOffscreenIndicator } from './components/has_offscreen_indicator.js'
import { LocalstoreGetsState } from './localstore_gets_state.js'
import { GoalOriented, Permanence } from './goals/goal.js'
import { AnimatesPosition } from './components/animates_position.js'
import { AnimatesRotation } from './components/animates_rotation.js'

const HasMaxSpeed = stampit(Component, GoalOriented, {
  init() {
    this.addGoal('speed', { max: 250 })
  },

  methods: {
    setSpeed(speed) {
      this.goals.speed.set({max: speed})
    },

    _getPositionLerpAlpha(distance, delta) {
      const speed = this.goals.speed.get().max
      const alpha = speed * delta / distance
      return THREE.MathUtils.clamp(alpha, 0.00001, 0.5)
    }
  }
})

const FOLLOW_TARGET_DISTANCE_AHEAD = 100.0
const FOLLOW_TARGET_SUFFICIENT_TIME = 2000.0

const FollowsTarget2 = stampit(Component, GoalOriented, {
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
      this._goalPos.position.copy(this.goals.p.get())
      const distance = this.object.position.distanceTo(this._goalPos.position)
      return distance
    },

    update(delta) {
      this._goalPos.position.copy(this.goals.p.get())
      
      this._source.position.copy(this.object.position)
      this._source.rotation.copy(this.object.rotation)
      
      this._target.position.normalize()
      this._target.position.multiplyScalar(FOLLOW_TARGET_DISTANCE_AHEAD)
      this._target.position.add(this._source.position)
      
      const dueAt = Date.now() + FOLLOW_TARGET_SUFFICIENT_TIME
      const goalToTargetDist = this._goalPos.position.distanceTo(this._target.position)
      if (goalToTargetDist > FOLLOW_TARGET_DISTANCE_AHEAD/2) {
        this.setGoal('p', {
          x: this._target.position.x,
          y: this._target.position.y,
          z: this._target.position.z,
        }, dueAt)
        
      }
      
      this._source.lookAt(this._target.position)
      const dist = this._source.position.distanceTo(this._target.position)
      if (dist > this.closeEnough) {
        this.setGoal('r', {
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
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  AnimatesPosition,
  AnimatesRotation,
  HasAnimationMixer,
  WalksWhenMoving,
  // HasUniqueColor,
  // UpdatesLabelToUniqueColor,
  HasMaxSpeed,
  FollowsTarget2,
  // HasOffscreenIndicator,
  LocalstoreGetsState,
  {
    props: {
      permanence: Permanence.TRANSIENT
    },

    init() {
      this.videoBubble.offset = new THREE.Vector3(0, 190, 0)
    }
  }
).setType('player')

export {
  Player,
}