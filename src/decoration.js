import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './components/has_object.js'
import { HasImage } from './components/has_image.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './components/follows_target.js'
import { NetworkSetsState } from './network_persistence.js'

const Decoration = stampit(
  Entity,
  HasObject,
  HasImage,
  HasEmissiveMaterial,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState
)

export { Decoration }