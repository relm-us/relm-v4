import stampit from 'stampit'
import {
  Vector3,
  Object3D,
  Color,
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
  BoxBufferGeometry,
  BoxHelper,
  MathUtils,
} from 'three'

import { ServerDate } from './lib/ServerDate.js'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasLabel } from './components/has_label.js'
// import { UpdatesLabelToUniqueColor } from './components/updates_label_to_unique_color.js'
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
      speed: defineGoal('spd', { max: 250 }),
    },
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
      const alpha = (speed * delta) / distance
      return MathUtils.clamp(alpha, 0.00001, 0.5)
    },
  },
})

const FOLLOW_TARGET_DISTANCE_AHEAD = 100.0
const FOLLOW_TARGET_SUFFICIENT_TIME = 5000.0

const FollowsTarget2 = stampit(Component, {
  init() {
    this._willVector = new Vector3()
    this._forceVector = new Vector3()
    this._followsTargetDebug = false
    this.autonomous = true

    this._createTargetObjects()
  },

  methods: {
    setFollowsTargetDebug(value) {
      this._followsTargetDebug = value
      this._createTargetObjects()
    },

    _createTargetObjects() {
      if (this._source) {
        this.stage.scene.remove(this._source)
      }
      if (this._sourceBox) {
        this.object.remove(this._sourceBox)
      }
      if (this._target) {
        this.stage.scene.remove(this._target)
      }
      if (this._goalPos) {
        this.stage.scene.remove(this._goalPos)
      }

      if (this._followsTargetDebug) {
        const sphere1 = new SphereBufferGeometry(10)
        this._source = new Mesh(
          sphere1,
          new MeshBasicMaterial({ color: 0xff7700 })
        )
        this.stage.scene.add(this._source)

        this._sourceBox = new BoxHelper(this._source, 0xffffff)
        this.object.add(this._sourceBox)

        const sphere2 = new SphereBufferGeometry(10)
        this._target = new Mesh(
          sphere2,
          new MeshBasicMaterial({ color: 0x0000aa })
        )
        this.stage.scene.add(this._target)

        const box1 = new BoxBufferGeometry(10, 10, 10)
        this._goalPos = new Mesh(
          box1,
          new MeshBasicMaterial({ color: 0xff0000 })
        )
        this.stage.scene.add(this._goalPos)
      } else {
        this._source = new Object3D()
        this._target = new Object3D()
        this._goalPos = new Object3D()
      }
    },

    addPosition(vector) {
      this._willVector.add(vector)
    },

    forceDirection(vector) {
      this._forceVector.add(vector)
    },

    getDistanceToTarget() {
      this._goalPos.position.copy(this.goals.position.toJSON())
      const distance = this.object.position.distanceTo(this._goalPos.position)
      return distance
    },

    update(delta) {
      if (this.autonomous) return
      // TODO: can we reduce the frequency of this test?

      // Fastest way to copy from position goal is to `get` attributes
      this._goalPos.position.x = this.goals.position.get('x')
      this._goalPos.position.y = this.goals.position.get('y')
      this._goalPos.position.z = this.goals.position.get('z')

      // Fastest way to copy from rotation goal is to `get` attributes
      this._goalPos.rotation.x = this.goals.rotation.get('x')
      this._goalPos.rotation.y = this.goals.rotation.get('y')
      this._goalPos.rotation.z = this.goals.rotation.get('z')

      // Normalize the target so that pursuit is of an even speed in all directions
      this._willVector.normalize()
      this._willVector.multiplyScalar(FOLLOW_TARGET_DISTANCE_AHEAD)
      this._target.position.copy(this.object.position)
      this._target.position.add(this._willVector)

      const dueAt = ServerDate.now() + FOLLOW_TARGET_SUFFICIENT_TIME
      let addedForce = false
      if (this._forceVector.length() > 0.1) {
        addedForce = true
        const pos = new Vector3()
        pos.copy(this._target.position)
        pos.add(this._forceVector)
        this._target.position.lerp(pos, 0.2)
        this.goals.position.update(
          {
            x: this._target.position.x,
            y: this._target.position.y,
            z: this._target.position.z,
          },
          dueAt
        )
      }

      // See if we need to update the position as the target is followed
      const goalToTargetDist = this._goalPos.position.distanceTo(
        this._target.position
      )
      if (goalToTargetDist > FOLLOW_TARGET_DISTANCE_AHEAD / 2) {
        this.goals.position.update(
          {
            x: this._target.position.x,
            y: this._target.position.y,
            z: this._target.position.z,
          },
          dueAt
        )
      }

      // See if we need to update the rotation angle as the target is followed
      this._source.position.copy(this.object.position)
      this._source.lookAt(this._target.position)
      const sourceToTargetDist = this._source.position.distanceTo(
        this._target.position
      )
      const angle = this._goalPos.quaternion.angleTo(this._source.quaternion)
      if (!addedForce && sourceToTargetDist > 1.0 && angle > 0.01) {
        this.goals.rotation.update(
          {
            x: this._source.rotation.x,
            y: this._source.rotation.y,
            z: this._source.rotation.z,
          },
          dueAt
        )
      }

      // Reset the addVector so that the next frame's calls to addPosition will start from origin
      this._willVector.set(0, 0, 0)
      this._forceVector.set(0, 0, 0)
    },
  },
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
  HasMaxSpeed,
  FollowsTarget2,
  HasOffscreenIndicator,
  LocalstoreGetsState,
  stampit(Component, {
    deepStatics: {
      goalDefinitions: {
        color: defineGoal('clr', { r: 1.0, g: 1.0, b: 1.0 }),
        video: defineGoal('vid', { cam: true }),
      },
    },

    init() {
      this.thoughtBubbleOffset = { x: 60, y: 110 }
    },

    methods: {
      update(_delta) {
        const colorGoal = this.goals.color
        if (!colorGoal.achieved) {
          const color = new Color(
            colorGoal.get('r'),
            colorGoal.get('g'),
            colorGoal.get('b')
          )
          this.setLabelUnderlineColor(color)
          colorGoal.markAchieved()
        }

        const videoGoal = this.goals.video
        if (!videoGoal.achieved) {
          const vidobj = this.videoBubble.object
          vidobj.setIsCamera(videoGoal.get('cam'))

          vidobj.setOnClick(() => {
            if (videoGoal.get('cam') === false) {
              vidobj.video.requestFullscreen()
              vidobj.video.classList.add('fullscreen')
            }
            document.addEventListener('fullscreenchange', () => {
              vidobj.video.classList.remove('fullscreen')
            })
          })

          vidobj.setOnDrag((pos) => {
            const offsetGoal = this.goals.videoBubbleOffset
            // console.log('player onDrag', pos, this.stage.fov)
            offsetGoal.update({
              x: offsetGoal.get('x') + (pos.x * 100) / this.stage.fov,
              y: offsetGoal.get('y') - (pos.y * 100) / this.stage.fov,
              z: offsetGoal.get('z'),
            })
          })

          videoGoal.markAchieved()
        }
      },
    },
  })
).setType('player')

export { Player }
