import stampit from 'stampit'

const { PerspectiveCamera, MathUtils, Vector3 } = THREE

const CAMERA_DEFAULT_ISOMETRY = 1.25 // a number between 0.25 - 16.0
const CAMERA_DEFAULT_PERSPECTIVE_RATIO = 11.25 / CAMERA_DEFAULT_ISOMETRY

const FOV_DEFAULT_MIN = 75.0
const FOV_DEFAULT_MAX = 280.0

const SceneWithCamera = stampit({
  name: 'SceneWithCamera',

  props: {
    isometry: CAMERA_DEFAULT_ISOMETRY,
    perspectiveRatio: CAMERA_DEFAULT_PERSPECTIVE_RATIO,
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
    this.setDefaultFovRange()

    this.on('resize', this.adjustNewWindowSize)
  },

  methods: {
    setDefaultFovRange() {
      this.minFov = FOV_DEFAULT_MIN
      this.maxFov = FOV_DEFAULT_MAX
    },

    setFov(value) {
      const maxZoomOut = this.minFov
      const maxZoomIn = this.maxFov
      this.fov = MathUtils.clamp(value, maxZoomOut, maxZoomIn)
      this.adjustNewWindowSize()
    },

    setFovRatio(value) {
      this.fov = value * (this.maxFov - this.minFov) + this.minFov
      this.adjustNewWindowSize()
    },

    getFovRatio() {
      return (this.fov - this.minFov) / (this.maxFov - this.minFov)
    },

    adjustNewWindowSize() {
      if (!this.camera) {
        this.camera = new PerspectiveCamera(
          this.perspectiveRatio,
          this.width / this.height,
          1000, // near clipping
          10000 // far clipping
        )
      }
      const aspect = this.width / this.height
      this.camera.aspect = aspect
      this.camera.fov = this.height / this.fov
      this.camera.updateProjectionMatrix()
    },
  },
})

export { SceneWithCamera }
