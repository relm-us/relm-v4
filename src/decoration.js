import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './has_object.js'
import { HasImage } from './has_image.js'
import { NetworkSetsState } from './network_sets_state.js'

const Decoration = stampit(
  Entity,
  HasObject,
  HasImage,
  NetworkSetsState
)

export { Decoration }