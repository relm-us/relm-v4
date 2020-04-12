import stampit from 'stampit'

import { Component } from './component.js'
import { HasObject } from './has_object.js'

const { Vector3, Matrix4, Quaternion, MathUtils } = THREE

const FollowsTarget = stampit(Component, HasObject, {
  props: {
    speed: 100.0,
    turnSpeed: 10.0,
    closeEnough: 1.0,
    distanceToTarget: 0.0,
  },

  deepProps: {
    state: {
      position: {
        /**
         * @type {Vector3}
         */
        now: null,
        /**
         * @type {Vector3}
         */
        target: null,
      },
    }
  },

  /**
   * Initializes the FollowsTarget stamp
   * @param {Vector3} position Initial position (in cartesian coordinates)
   * @param {Quaternion} direction Initial direction (as a quaternion)
   */
  init({
    position,
    speed = this.speed,
  }) {
    this.speed = speed
    this.state.position.now = new Vector3(0, 0, 0)
    this.state.position.target = new Vector3(0, 0, 0)
    
    // Note that `copy` just takes the .x, .y, .z, (and .w) properties
    // and then calls _onChangeCallbeck(). See https://github.com/mrdoob/three.js
    // /blob/3ba0553208cfc9113152f5f39b4036a448cf3f25/src/math/Quaternion.js#L186
    this.state.position.now.copy(position || this.state.position.now)
    this.state.position.target.copy(position || this.state.position.now)

    this.quaternion = new Quaternion()
    this.matrix = new Matrix4()
  },

  methods: {
    /**
     * @returns {Vector3}
     */
    getPosition() {
      return this.state.position.now
    },

    /**
     * @param {Vector3} coords
     */
    setPosition(coords) {
      this.state.position.target.copy(coords)
    },
    
    /**
     * Instantly move to a position (no animation, no lerp).
     * FIXME: Put this in a better place? CanWarp Component?
     
     * @param {Vector3} coords 
     */
    warpToPosition(coords) {
      this.state.position.now.copy(coords)
      this.object.position.copy(coords)
    },

    updatePosition(delta, distance) {
      if (distance > this.closeEnough) {
        const lerpAlpha = MathUtils.clamp(this.speed * delta / distance, 0.00001, 0.5)
        this.state.position.now.lerp(this.state.position.target, lerpAlpha)

        // Update the root object's position to match update
        this.object.position.copy(this.state.position.now)
      }
    },

    updateDirection(delta, distance) {
      this.matrix.lookAt(this.state.position.target, this.state.position.now, this.object.up)
      this.quaternion.setFromRotationMatrix(this.matrix)

      if (distance > this.closeEnough) {
        const lerpAlpha = MathUtils.clamp(this.turnSpeed * delta, 0.00001, 1)
        this.object.quaternion.slerp(this.quaternion, lerpAlpha)
      }
    },

    update(delta) {
      this.distanceToTarget = this.state.position.now.distanceTo(this.state.position.target)
      this.updatePosition(delta, this.distanceToTarget)
      this.updateDirection(delta, this.distanceToTarget)
    },
  }

})

export { FollowsTarget }
