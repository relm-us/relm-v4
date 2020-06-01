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

const FollowsTarget2 = stampit(Component, {
  init() {
    this.distanceToTarget = 0.0
    this.closeEnough = 1.0
    this._source = new THREE.Object3D()
    this._target = new THREE.Object3D()
    this.followAdd = new THREE.Vector3()
  },

  methods: {
    addPosition(vector) {
      this.followAdd.add(vector)
      // console.log('addPosition', this.uuid, vector, this.followAdd)
      // console.log('FT2.addPosition', this)
    },

    update(delta) {
      const pos = this.goals.p.get()
      this._target.position.set(pos.x, pos.y, pos.z)
      this.distanceToTarget = this.object.position.distanceTo(this._target.position)
      // console.log('FollowsTarget2.update', this.followAdd)
      
      if (this.distanceToTarget > this.closeEnough) {
        this._source.position.copy(this.object.position)
        this._source.rotation.copy(this.object.rotation)
        this._source.lookAt(this._target.position)
      }
      
      this.followAdd.normalize()
      this.followAdd.multiplyScalar(100.0)
      this.followAdd.add(this.object.position)
      const dueAt = Date.now() + 1000
      this.setGoal('p', {
        x: this.followAdd.x,
        y: this.followAdd.y,
        z: this.followAdd.z,
      }, dueAt)
      if (this.distanceToTarget > this.closeEnough) {
        this.setGoal('r', {
          x: this._source.rotation.x,
          y: this._source.rotation.y,
          z: this._source.rotation.z,
        }, dueAt)
      }
      // console.log('before reset followAdd', this.followAdd)
      this.followAdd.set(0, 0, 0)
      // this.followAdd.blah = true
      // console.log('FT2.update', this)
      // console.log('after reset followAdd', this.uuid, this.followAdd)
      // if (Math.random() > 0.9) throw Error('rand')
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
  // FollowsTarget,
  AnimatesPosition,
  AnimatesRotation,
  HasAnimationMixer,
  WalksWhenMoving,
  // HasUniqueColor,
  // UpdatesLabelToUniqueColor,
  HasMaxSpeed,
  FollowsTarget2,
  HasOffscreenIndicator,
  {
    props: {
      permanence: Permanence.TRANSIENT
    },

    // init() {
    //   this.videoBubble.offset = new THREE.Vector3(0, 190, 0)
    // }
  }
).setType('player')

export {
  Player,
}