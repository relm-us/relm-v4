import stampit from 'stampit'

const { PerspectiveCamera, MathUtils, Vector3 } = THREE

const CAMERA_DEFAULT_ISOMETRY = 1.25 // a number between 0.25 - 16.0
const CAMERA_DEFAULT_PERSPECTIVE_RATIO = 11.25 / CAMERA_DEFAULT_ISOMETRY
const CAMERA_DEFAULT_POSITION = new Vector3(0, 4000, 5000)

const SceneWithCamera = stampit({
  name: 'SceneWithCamera',
  
  props: {
    isometry: CAMERA_DEFAULT_ISOMETRY,
    perspectiveRatio: CAMERA_DEFAULT_PERSPECTIVE_RATIO,
    cameraIdealPosition: CAMERA_DEFAULT_POSITION,
  },

  init({
    isometry = this.isometry,
    perspectiveRatio = this.perspectiveRatio,
    cameraIdealPosition = this.cameraIdealPosition,
  }) {
    this.isometry = isometry
    this.perspectiveRatio = perspectiveRatio
    this.cameraIdealPosition = cameraIdealPosition
    this.fov = 100.0

    this.on('resize', this.adjustNewWindowSize)
  },

  methods: {
    setFov(value) {
      this.fov = MathUtils.clamp(value, 50.0, 150.0)
      this.adjustNewWindowSize()
    },

    adjustNewWindowSize () {
      if (!this.camera) {
        this.camera = new PerspectiveCamera(
          this.perspectiveRatio,
          this.width / this.height,
        // TODO: figure out what these magic numbers represent
          1500,
          12800 * this.isometry
        )
        this.camera.position.copy(this.cameraIdealPosition)
        this.camera.lookAt(0, 0, 0)
      }
      const aspect = this.width / this.height 
      this.camera.aspect = aspect
      this.camera.fov = this.height / this.fov
      this.camera.updateProjectionMatrix()
    }
  }

})

export { SceneWithCamera }