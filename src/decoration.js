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
  })
).setType('decoration')

export { Decoration }