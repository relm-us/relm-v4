import stampit from 'stampit'
import { Scene, Fog, Color, AmbientLight, DirectionalLight } from 'three'

const FOG_DEFAULT_COLOR = 0xffffff
const FOG_DEFAULT_NEAR_DISTANCE = 6600
const FOG_DEFAULT_FAR_DISTANCE = 8600

const LIGHT_AMBIENT_COLOR = 0xf0f0f0
const LIGHT_AMBIENT_FACTOR = 0.76666
// const LIGHT_DIRECTIONAL_COLOR = 0x666666
const LIGHT_DIRECTIONAL_COLOR = 0x333333
const LIGHT_DIRECTIONAL_FACTOR = 0.48

const HasScene = stampit({
  name: 'HasScene',

  props: {
    scene: new Scene(),
  },

  deepProps: {
    fog: {
      color: new Color(FOG_DEFAULT_COLOR),
      near: FOG_DEFAULT_NEAR_DISTANCE,
      far: FOG_DEFAULT_FAR_DISTANCE,
    },
  },

  init({ scene = this.scene, fog = this.fog }) {
    this.scene = scene
    // this.fog = fog

    this.ambientLight = new AmbientLight(
      LIGHT_AMBIENT_COLOR,
      LIGHT_AMBIENT_FACTOR
    )
    this.directionalLight = new DirectionalLight(
      LIGHT_DIRECTIONAL_COLOR,
      LIGHT_DIRECTIONAL_FACTOR
    )

    // scene.fog = new Fog(new Color(this.fog.color), this.fog.near, this.fog.far)
    scene.add(this.ambientLight)
    scene.add(this.directionalLight)
  },
})

export { HasScene }
