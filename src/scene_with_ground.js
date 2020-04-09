import stampit from 'stampit'

import { createGround } from './ground.js'

const GROUND_DEFAULT_SIZE = 12000
const GROUND_DEFAULT_REPEAT = 18

const SceneWithGround = stampit({
  props: {
    ground: null,
    groundSize: GROUND_DEFAULT_SIZE,
    groundRepeat: GROUND_DEFAULT_REPEAT,
    groundTexture: null,
  },

  init({ size = this.groundSize }) {
    this.ground = createGround(this.scene, size)
  },

  methods: {
    setGroundTexture(texture) {
      texture.repeat.set(this.groundRepeat, this.groundRepeat)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.encoding = THREE.sRGBEncoding
      this.groundTexture = texture
      for (let material of this.ground.texturedMaterials) {
        material.map = texture
      }
    }
  }
})

export { SceneWithGround }
