import stampit from 'stampit'

import { SkeletonUtils } from '../lib/SkeletonUtils.js'
import { Component } from './component.js'

const { AnimationMixer } = THREE

/**
 * Finds an AnimationClip with a function passed in as the condition. More flexible
 * than the AnimationClip.findByName function it was adapted from:
 * 
 * https://github.com/mrdoob/three.js
 * /blob/e88ddc6613f5d17a0b815ffbfb1d9ca46d63361d/src/animation/AnimationClip.js#L197
 * 
 * @param {Function} condition A filter function, returns true if a match is found.
 */
function findAnimationClip(objectOrClipArray, condition) {
  var clipArray = objectOrClipArray

  if (!Array.isArray( objectOrClipArray)) {
    var o = objectOrClipArray
    clipArray = o.geometry && o.geometry.animations || o.animations
  }

  for (var i = 0; i < clipArray.length; i ++) {
    if (condition(clipArray[ i ].name)) {
      return clipArray[ i ]
    }
  }

  return null
}

const HasAnimationMixer = stampit(Component, {
  props: {
    animationSpeed: 1.0,
    animationResourceId: null,
    animationMeshName: null,
    animationActions: ['walking', 'falling'],
    animationMixer: null,
    animatedObject: null,
    clips: {},
  },

  init({
    animationSpeed = this.animationSpeed,
    animationResourceId,
    animationMeshName,
    animationActions = this.animationActions
  }) {
    this.animationSpeed = animationSpeed
    this.animationResourceId = animationResourceId
    this.animationMeshName = animationMeshName
    this.animationActions = animationActions
  },

  methods: {
    getClonedObjectWithSkeleton() {
      let object3d
      this.resources.get(this.animationResourceId).scene.traverse(o1 => {
        if (o1.name === this.animationMeshName) { // Object3D, contains Bone & SkinnedMesh
          // Find mesh inside avatar container
          o1.traverse(o2 => {
            if (o2.isMesh) { this.setMeshDefaults(o2) }
          })
          object3d = SkeletonUtils.clone(o1)
        }
      })

      if (!object3d) {
        throw new Error(`Unable to find object in scene ${this.animationMeshName} in ${this.animationResourceId}`)
      }
      
      return object3d
    },

    setMeshDefaults (mesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (mesh.material) {
        mesh.material.metalness = 0.0
        mesh.material.transparent = true
      }
      return mesh
    },

    attachAnimatedObject() {
      // If this isn't the first time, remove existing animatedObject from the root object
      if (this.animatedObject) {
        this.object.remove(this.animatedObject)
      }

      // We must use a clone of the object so that our customizations aren't global
      this.animatedObject = this.getClonedObjectWithSkeleton()
      this.animatedObject.scale.set(1, 1, 1)
      this.object.add(this.animatedObject)
    },


    /**
     * Creates a `this.mixer` AnimationMixer object and a `this.clips` map for each 
     * of the animationActions defined in this stamp's props. Clips can be played
     * as animation sequences.
     * 
     * Note: the `animationActions` don't have to be exact matches, they must merely
     * be present in the animation's name. For example 'walking' will match
     * 'armature-15-walking'.
     */
    setup() {
      this.attachAnimatedObject()

      const animations = this.resources.get(this.animationResourceId).animations
      this.mixer = new AnimationMixer(this.animatedObject)
      for (const action of this.animationActions) {
        const animation = findAnimationClip(animations, (name) => (name.indexOf(action) >= 0))
        if (animation) {
          this.clips[action] = this.mixer.clipAction(animation)
        } else {
          console.error('Unable to find AnimationClip for action', action)
        }
      }
    },

    update(delta) {
      this.mixer.update(delta * this.animationSpeed)
    },

    teardown() {
      if (this.animatedObject) {
        this.object.remove(this.animatedObject)
      }
    }
 
  }
})

export { HasAnimationMixer }
