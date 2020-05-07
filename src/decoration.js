import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './has_object.js'
import { HasImage } from './has_image.js'
import { FollowsTarget } from './follows_target.js'
import { NetworkSetsState } from './network_persistence.js'

const Decoration = stampit(
  Entity,
  HasObject,
  HasImage,
  FollowsTarget,
  NetworkSetsState
)

export { Decoration }