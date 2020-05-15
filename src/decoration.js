import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './has_object.js'
import { HasImage } from './has_image.js'
import { HasEmissiveMaterial } from './has_emissive_material.js'
import { CanUiLock } from './can_ui_lock.js'
import { ReceivesPointer } from './receives_pointer.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'

const Decoration = stampit(
  Entity,
  HasObject,
  HasImage,
  HasEmissiveMaterial,
  CanUiLock,
  ReceivesPointer,
  FollowsTarget,
  NetworkSetsState
)

export { Decoration }