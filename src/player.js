import stampit from 'stampit'

import { Entity } from './entity.js'
import { HasObject } from './components/has_object.js'
import { HasLabel } from './components/has_label.js'
import { HasUniqueColor } from './components/has_unique_color.js'
import { UpdatesLabelToUniqueColor } from './components/updates_label_to_unique_color.js'
import { FollowsTarget } from './components/follows_target.js'
import { HasAnimationMixer } from './components/has_animation_mixer.js'
import { WalksWhenMoving } from './components/walks_when_moving.js'
import { HasThoughtBubble } from './components/has_thought_bubble.js'
import { HasVideoBubble } from './components/has_video_bubble.js'
import { HasOpacity } from './components/has_opacity.js'
import { HasOffscreenIndicator } from './components/has_offscreen_indicator.js'
import { AwarenessGetsState, AwarenessSetsState } from './network_awareness.js'
import { LocalstoreGetsState } from './localstore_gets_state.js'


const PlayerBase = stampit(
  Entity,
  HasObject,
  HasOpacity,
  HasLabel,
  HasVideoBubble,
  HasThoughtBubble,
  FollowsTarget,
  HasAnimationMixer,
  WalksWhenMoving,
  HasUniqueColor,
  UpdatesLabelToUniqueColor,
)

const Player = stampit(
  PlayerBase,
  AwarenessGetsState,
  LocalstoreGetsState,
{
  name: 'Player',
})

const OtherPlayer = stampit(
  PlayerBase,
  HasOffscreenIndicator,
  AwarenessSetsState,
{
  name: 'OtherPlayer'
})


export {
  Player,
  OtherPlayer
}