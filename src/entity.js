import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { ResourceLoader } from './resource_loader.js'
import { Component } from './components/component.js'
import { Typed } from './typed.js'
import { uuidv4 } from './util.js'
import { stage } from './stage.js'

// Show progress as we load resources
const resources = (window.resources = ResourceLoader())

/**
 * An Entity is the most basic thing in the game world. It has only an identifier (`.uuid`),
 * and comes configured with a Stage, and Resources.
 *
 * Entities are intended to go on Stage, but are not shared on the Network.
 * See EntityShared for entities shared on the network.
 *
 * Example:
 *   let monster = Entity({ uuid: '123' }) // do more with monster
 */
const Entity = stampit(Typed, EventEmittable, Component, {
  name: 'Entity',

  // Static configuration. See https://stampit.js.org/api/configuration.
  conf: {
    /**
     * @type {Stage}
     */
    stage: null,

    /**
     * @type {ResourceLoader}
     */
    resources: null,
  },

  init({ uuid, stage, resources }, { stamp }) {
    this._uuid = uuid || uuidv4()
    this.stage = stage || stamp.compose.configuration.stage
    this.resources = resources || stamp.compose.configuration.resources

    Object.defineProperty(this, 'uuid', {
      configurable: true,
      get: () => {
        return this._uuid
      },
      set: (uuid) => {
        this._uuid = uuid
      },
    })
  },

  methods: {
    /**
     * Note that each EntityUnconfigured can have multiple Components, each with
     * `setup`, `update` and `teardown` methods. These methods will be called
     * automatically during the lifecycle of an Entity as it moves on stage, is
     * rendered there, and moves off stage.
     */
  },
}).conf({ stage, resources })

export { Entity }
