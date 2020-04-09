const { WebGLRenderer, Color, sRGBEncoding, PCFSoftShadowMap } = THREE

let renderer

function setupRenderer () {
  renderer = new WebGLRenderer({
    alpha: true,
    antialias: true
  })
  renderer.setClearColor(new Color('black'), 0)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputEncoding = sRGBEncoding
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  renderer.domElement.id = 'glcanvas'

  return renderer
}

function updateRenderer (w, h) {
  renderer.setSize(w, h)
}

export { setupRenderer, updateRenderer }
