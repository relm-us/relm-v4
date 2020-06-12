import stampit from 'stampit'

import { Entity } from './entity.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { LoadsAsset } from './components/loads_asset_new.js'
import { VisibleEdges } from './visible_edges.js'
import { AnimatesScale } from './components/animates_scale.js'
import { AnimatesRotation } from './components/animates_rotation.js'
import { AnimatesPosition } from './components/animates_position.js'
import { UsesAssetAsImage } from './components/uses_asset_as_image.js'
import { NetworkSetsGoals } from './goals/goal.js'

const Decoration = window.DecorationNew = stampit(
  Entity,
  HasObject,
  LoadsAsset,
  UsesAssetAsImage,
  AnimatesScale,
  AnimatesRotation,
  AnimatesPosition,
  NetworkSetsGoals,
  HasEmissiveMaterial,
  ReceivesPointer,
  // FollowsTarget,
  stampit(Component, {
    init() {
      this.edges = VisibleEdges({
        object: this.object,
      })
      this.on('object-modified', () => {
        this.edges.enable()
      })
    },

    methods: {
      update() {
        // console.log('decoration', this.goals)
      }
    }
  })
).setType('decoration')

export { Decoration }