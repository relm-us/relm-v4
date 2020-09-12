import stampit from 'stampit'
import {
  Vector3,
  Mesh,
  MeshStandardMaterial,
  CircleBufferGeometry,
  PlaneBufferGeometry,
  // Constants
  DoubleSide,
  RepeatWrapping,
  sRGBEncoding,
} from 'three'

import { EntityShared } from './entity_shared.js'
import { Component } from './components/component.js'
import { HasObject } from './components/has_object.js'
import { HasEmissiveMaterial } from './components/has_emissive_material.js'
import { ReceivesPointer } from './receives_pointer.js'
import { LoadsAsset } from './components/loads_asset.js'
import { AnimatesPosition } from './components/animates_position.js'
import { defineGoal } from './goals/goal.js'
import { RoughCircleBufferGeometry } from './geometries/rough_circle_geometry.js'

const GROUND_ROUGH_CIRCLE_VARIATION = 20
const GROUND_BOUNDS_BUFFER_SIZE = 150
const GROUND_BOUNDS_SMIDGE = 25
const GROUND_ADD_POSITION = 120

const UsesAssetAsGround = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      ground: defineGoal('ground', {
        type: 'circle',
        size: 1000,
        repeat: 2,
        seed: 111,
        color: 0xffffff,
      }),
    },
  },

  init() {
    this.geometry = null
    this.material = null
    this.mesh = null

    this.texture = null

    this.on('asset-loaded', this._setTexture)
  },

  methods: {
    _setTexture(texture) {
      if (texture) {
        this.texture = texture.clone()

        this.texture.wrapS = RepeatWrapping
        this.texture.wrapT = RepeatWrapping
        this.texture.encoding = sRGBEncoding

        // Since we're using a clone, and updating its properties, we need to set this flag or risk being ignored
        this.texture.needsUpdate = true

        this._createGroundMeshFromLoadedTexture(this.texture)
      } else {
        this.texture = null
      }
    },

    _createGeometry() {
      const groundType = this.goals.ground.get('type')
      const groundSize = this.goals.ground.get('size')
      const randomSeed = this.goals.ground.get('seed')
      switch (groundType) {
        case 'circle':
          return new CircleBufferGeometry(groundSize / 2, 60)
        case 'rough':
          return new RoughCircleBufferGeometry(
            groundSize / 2,
            60,
            this._roughCircleVariation(),
            randomSeed
          )
        case 'square':
          return new PlaneBufferGeometry(groundSize, groundSize)
        default:
          console.error('Ground type not recognized', groundType)
      }
    },

    _createGroundMeshFromLoadedTexture(texture) {
      const geometry = this._createGeometry()

      if (texture) {
        const groundSize = this.goals.ground.get('size')
        const repeat =
          groundSize / texture.image.width / this.goals.ground.get('repeat')
        texture.repeat.set(repeat, repeat)
      }

      const material = new MeshStandardMaterial({
        map: texture,
        side: DoubleSide,
        color: this.goals.ground.get('color'),
        depthWrite: true,
        transparent: false,
      })

      const mesh = new Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2

      this._setMesh(mesh)
    },

    _setMesh(mesh) {
      if (this.mesh) {
        this.object.remove(this.mesh)
      }
      this.mesh = mesh
      this.object.add(this.mesh)
      this.emit('mesh-updated')
    },

    _roughCircleVariation() {
      return this.goals.ground.get('size') / GROUND_ROUGH_CIRCLE_VARIATION
    },

    _keepCircleBounds(player, distance, radius) {
      if (distance > radius && distance <= radius + GROUND_BOUNDS_BUFFER_SIZE) {
        const vec = new Vector3()
        vec.copy(this.object.position)
        vec.sub(player.object.position)

        player.forceDirection(vec)
      }
    },

    _keepSquareBounds(player, halfsize) {
      const dx = player.object.position.x - this.object.position.x
      const dz = player.object.position.z - this.object.position.z
      const bound = halfsize + GROUND_BOUNDS_BUFFER_SIZE
      if (dz > -bound && dz < bound) {
        if (dx > halfsize && dx < bound) {
          player.addPosition(new Vector3(-GROUND_ADD_POSITION, 0, 0))
        } else if (dx < -halfsize && dx > -bound) {
          player.addPosition(new Vector3(GROUND_ADD_POSITION, 0, 0))
        }
      }

      if (dx > -bound && dx < bound) {
        if (dz > halfsize && dz < bound) {
          player.addPosition(new Vector3(0, 0, -GROUND_ADD_POSITION))
        } else if (dz < -halfsize && dz > -bound) {
          player.addPosition(new Vector3(0, 0, GROUND_ADD_POSITION))
        }
      }
    },

    update(_delta) {
      const groundGoal = this.goals.ground
      if (!groundGoal.achieved) {
        this._createGroundMeshFromLoadedTexture(this.texture)
        groundGoal.markAchieved()
      }

      const player = this.stage.player
      if (!player || this.stage.editorMode) {
        return
      }

      // Prevent the player from leaving the ground's boundaries
      const distance = this.object.position.distanceTo(player.object.position)
      const radius = groundGoal.get('size') / 2
      switch (groundGoal.get('type')) {
        case 'circle':
          return this._keepCircleBounds(
            player,
            distance,
            radius - GROUND_BOUNDS_SMIDGE
          )
        case 'rough':
          return this._keepCircleBounds(
            player,
            distance,
            radius - this._roughCircleVariation()
          )
        case 'square':
          return this._keepSquareBounds(player, radius - GROUND_BOUNDS_SMIDGE)
      }
    },
  },
})

const Ground = stampit(
  EntityShared,
  HasObject,
  LoadsAsset,
  UsesAssetAsGround,
  AnimatesPosition,
  HasEmissiveMaterial,
  ReceivesPointer
).setType('ground')

export { Ground }
