import stampit from 'stampit'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { LoadsAsset } from './components/loads_asset.js'
import { VisibleEdges } from './visible_edges.js'
import { AnimatesScale } from './components/animates_scale.js'
import { AnimatesRotation } from './components/animates_rotation.js'
import { AnimatesPosition } from './components/animates_position.js'
import { UsesAssetAsImage } from './components/uses_asset_as_image.js'
import { config } from './config.js'

/**
 * Returns a ratio that can be used to multiply by the object's current size so as to
 * scale it up or down to the desired largestSide size.
 *
 * @param {Image} image The image with width and height
 * @param {number} largestSide The size of the desired "largest side" after scaling
 */
const getScaleRatio = (image, largestSide) => {
  let ratio
  if (image.width > image.height) {
    ratio = largestSide / image.width
  } else {
    ratio = largestSide / image.height
  }
  return ratio
}

const Decoration = stampit(
  EntityShared,
  HasObject,
  LoadsAsset,
  UsesAssetAsImage,
  AnimatesScale,
  AnimatesRotation,
  AnimatesPosition,
  HasEmissiveMaterial,
  ReceivesPointer,
  stampit(Component, {
    init() {
      this.edges = VisibleEdges({
        object: this.object,
      })
      this.on('mesh-updated', () => {
        this.edges.rebuild()
      })
      this.on('select', () => {
        this.edges.enable()
      })
      this.on('deselect', () => {
        this.edges.disable()
      })
    },

    methods: {
      normalize() {
        const ratio = getScaleRatio(
          this.texture.image,
          config.DEFAULT_OBJECT_SIZE
        )
        this.goals.normalizedScale.update({ v: ratio })
      },
    },
  })
).setType('decoration')

export { Decoration }
