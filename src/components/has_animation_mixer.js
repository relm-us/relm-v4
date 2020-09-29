import stampit from 'stampit'
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js'

import { AnimationMixer } from 'three'
// import { SkeletonUtils } from '../lib/SkeletonUtils.js'
import { Component } from './component.js'
import { defineGoal } from '../goals/goal.js'
import {
  createMask,
  uvTranslate,
  maskAllowOtherColors,
  maskAllowSkinTones,
} from '../uvMapUtils.js'
import { armatures } from '../avatars.js'

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

  if (!Array.isArray(objectOrClipArray)) {
    var o = objectOrClipArray
    clipArray = (o.geometry && o.geometry.animations) || o.animations
  }

  for (var i = 0; i < clipArray.length; i++) {
    if (condition(clipArray[i].name)) {
      return clipArray[i]
    }
  }

  return null
}

const HasAnimationMixer = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      // Two independent goals because they can each be achieved separately
      animationMesh: defineGoal('anm', { v: null }),
      animationSpeed: defineGoal('ans', { v: 1.0 }),
      skintone: defineGoal('skt', { x: 0, y: 0 }),
      clothtone: defineGoal('clt', { x: 0, y: 0 }),
    },
  },

  init() {
    this.clips = {}
    this.animationMixer = null
    this.animationResourceId = 'people'
    this.animatedObject = null
    this.animationActions = ['walking', 'falling']
  },

  methods: {
    getAvatar() {
      const [gender, letter, _] = this.goals.animationMesh.get('v').split('-')

      if (gender === 'mal') {
        return ['m', armatures.m[letter]]
      } else if (gender === 'fem') {
        return ['f', armatures.f[letter]]
      } else {
        return null
      }
    },

    getClonedObjectWithSkeleton(meshName) {
      let object3d
      let skinnedMesh
      this.resources.get(this.animationResourceId).scene.traverse((o1) => {
        if (o1.name === meshName) {
          // Object3D, contains Bone & SkinnedMesh
          // Find mesh inside avatar container
          object3d = SkeletonUtils.clone(o1)
          object3d.traverse((o2) => {
            if (o2.isSkinnedMesh) {
              skinnedMesh = o2
              this.setMeshDefaults(o2)
            }
          })
        }
      })

      if (!object3d) {
        throw new Error(
          `Unable to find object in scene ${meshName} in ${this.animationResourceId}`
        )
      }

      return [object3d, skinnedMesh]
    },

    setMeshDefaults(mesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (mesh.material) {
        // When using custom UV Maps (for skintone/clothtone) we need the geometry
        // to be its own instance, so that the 'uv' attribute doesn't affect other
        // players with the same avatar.
        mesh.geometry = mesh.geometry.clone()

        mesh.material.metalness = 0.0
        mesh.material.transparent = true
      }
      return mesh
    },

    attachAnimatedObject(meshName) {
      // If this isn't the first time, remove existing animatedObject from the root object
      if (this.animatedObject) {
        this.object.remove(this.animatedObject)
      }

      // We must use a clone of the object so that our customizations aren't global
      ;[
        this.animatedObject,
        this.skinnedMesh,
      ] = this.getClonedObjectWithSkeleton(meshName)
      this.animatedObject.scale.set(1, 1, 1)
      this.object.add(this.animatedObject)

      if (this.skinnedMesh) {
        this.originalUvAttr = this.getUv().clone()
        this.uvClothtoneMask = null
        this.uvClothtoneShift = { x: 0, y: 0 }
        this.uvSkintoneMask = null
        this.uvSkintoneShift = { x: 0, y: 0 }
      }
    },

    getUv() {
      if (this.skinnedMesh) {
        return this.skinnedMesh.geometry.getAttribute('uv')
      }
    },

    uvReset() {
      const uvAttr = this.getUv()
      if (uvAttr && this.originalUvAttr) {
        uvAttr.copy(this.originalUvAttr)
        uvAttr.needsUpdate = true
      }
    },

    uvTranslate({ clothtone, skintone }) {
      const uvAttr = this.getUv()

      if (!this.uvClothtoneMask) {
        this.uvClothtoneMask = createMask(uvAttr, maskAllowOtherColors)
      }
      if (!clothtone) {
        clothtone = this.uvClothtoneShift
      } else {
        this.uvClothtoneShift = clothtone
      }

      if (!this.uvSkintoneMask) {
        this.uvSkintoneMask = createMask(uvAttr, maskAllowSkinTones)
      }
      if (!skintone) {
        skintone = this.uvSkintoneShift
      } else {
        this.uvSkintoneShift = skintone
      }

      this.uvReset()

      uvTranslate(this.getUv(), clothtone, this.uvClothtoneMask)
      uvTranslate(this.getUv(), skintone, this.uvSkintoneMask)
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
    changeAnimationMesh(meshName) {
      this.attachAnimatedObject(meshName)

      // TODO: this is a bit of a hack, but it seems to be the only way to match
      // animations to mesh name:
      // - our mesh names are of the form '[gender]-[sequence]-armature'
      // - we remove the '-armature' and are left with a prefix
      // - this prefix can be used to match the AnimationClip (see findAnimationClip below)
      const prefix = meshName.split('-').slice(0, 2).join('-')

      const animations = this.resources.get(this.animationResourceId).animations
      this.mixer = new AnimationMixer(this.animatedObject)
      for (const action of this.animationActions) {
        const animation = findAnimationClip(animations, (name) => {
          return name.indexOf(prefix) === 0 && name.indexOf(action) >= 0
        })
        if (animation) {
          this.clips[action] = this.mixer.clipAction(animation)
        } else {
          console.error('Unable to find AnimationClip for action', action)
        }
      }

      this._setBoundingBoxHack()
    },

    /**
     * Because FBX-imported animations seem to cause the bounding box around the player to be Very Wrong
     * (i.e. just a pixel or so at the base of the player's feet), we need a hack to tell the culler
     * to not remove the player when they go off screen.
     *
     * See https://github.com/mrdoob/three.js/issues/18334 for ongoing discussion.
     */
    _setBoundingBoxHack() {
      this.object.traverse((o) => {
        if (o.isMesh) {
          o.frustumCulled = false
        }
      })
    },

    update(delta) {
      const animMeshGoal = this.goals.animationMesh
      const skintoneGoal = this.goals.skintone
      const clothtoneGoal = this.goals.clothtone

      if (!animMeshGoal.achieved) {
        const meshName = animMeshGoal.get('v')
        if (meshName) {
          this.changeAnimationMesh(meshName)
        } else {
          console.warn(
            'changeAnimationMesh skipped, meshName not set:',
            meshName,
            this.goals.toJSON()
          )
        }
        animMeshGoal.markAchieved()

        // If mesh changes, invalidate the UV translation
        skintoneGoal.achieved = false
        clothtoneGoal.achieved = false
      }

      if (!skintoneGoal.achieved || !clothtoneGoal.achieved) {
        this.uvTranslate({
          skintone: {
            x: skintoneGoal.get('x'),
            y: skintoneGoal.get('y'),
          },
          clothtone: {
            x: clothtoneGoal.get('x'),
            y: clothtoneGoal.get('y'),
          },
        })
        skintoneGoal.markAchieved()
        clothtoneGoal.markAchieved()
      }

      const animSpeedGoal = this.goals.animationSpeed
      // if (!animSpeedGoal.achieved) {
      //   const speed = animSpeedGoal.get().v
      //   if (this.mixer) {
      //     // TODO: transition to new speed
      //     console.log('set animSppedGoal', speed)
      //     this.mixer.update(delta * speed)
      //     animSpeedGoal.markAchieved()
      //   }
      // }

      if (this.mixer) {
        const speed = animSpeedGoal.get('v')
        this.mixer.update(delta * speed)
      }
    },

    teardown() {
      if (this.animatedObject) {
        this.object.remove(this.animatedObject)
      }
    },
  },
})

export { HasAnimationMixer }
