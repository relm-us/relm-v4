import stampit from 'stampit'

const { WebGLRenderer, Color, sRGBEncoding, PCFSoftShadowMap } = THREE

const SceneWithRenderer = stampit({
  name: 'SceneWithRenderer',
  
  init() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })
    this.renderer.setClearColor(new Color('black'), 0)
    // TODO: get pixelRatio through props rather than global 'window' object
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.renderer.domElement.id = 'glcanvas'
    this.renderer.domElement.tabIndex = -1

    this.on('resize', ({ width, height }) => {
      this.renderer.setSize(width, height)
    })
  },

  methods: {
    render(delta) {
      this.renderer.render(this.scene, this.camera)
    },
  }
})

export { SceneWithRenderer }
