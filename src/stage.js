import { HtmlMixer, HtmlMixerHelpers } from './lib/HtmlMixer.js'
import { createGround } from './ground.js'
import { setupRenderer } from './renderer.js'
import { createAmbientLight, createDirectionalLight } from './light.js'

const { Scene, Clock, Fog, Color, Vector3, PerspectiveCamera, MathUtils } = THREE
const GROUND_SIZE = 12000

const ISOMETRY = 1.25 // a number between 0.25 - 16.0
const perspectiveRatio = 11.25 / ISOMETRY
const cameraIdealPosition = new Vector3(
  0,
  3200 * (ISOMETRY / 2),
  -5600 * (ISOMETRY / 2)
)

class Stage {
  constructor(screenWidth, screenHeight, { skybox, grass }) {
    this.scene = new Scene()
    this.scene.fog = new Fog(new Color(0xC9D9FF), 6000, 13000)

    this.clock = new Clock()
    this.clock.start()
    
    this.background = skybox
    this.fitBackgroundToScreen(screenWidth, screenHeight)

    this.ground = createGround(this.scene, grass, GROUND_SIZE, GROUND_SIZE)

    this.renderer = setupRenderer()
    this.renderTasks = []

    this.camera = this.createCamera(screenWidth, screenHeight)
    this.updateCamera(screenWidth, screenHeight)

    this.htmlMixer = new HtmlMixer.Context(this.renderer, this.camera)
    this.htmlMixer.rendererCss.setSize(screenWidth, screenHeight)

    this.lights = {
      ambient: createAmbientLight(),
      directional: createDirectionalLight()
    }

    const itemsToAdd = [
      this.camera,
      this.lights.ambient,
      this.lights.directional
    ]
    for (let item of itemsToAdd) { this.scene.add(item) }
    
    // TODO: fire this after domReady event
    this.onDomReady()
  }

  render (avgDelta) {
    // Top-level children that have a 'render' function will render themselves here
    for (let child of this.scene.children) {
      if (typeof child.render === 'function') {
        child.render(avgDelta)
      }
    }
    for (let task of this.renderTasks) {
      task(avgDelta)
    }
    this.htmlMixer.update()
    this.renderer.render(this.scene, this.camera)
  }

  addEntity (entity, parent) {
    let actualParent = parent ? parent : this.scene
    actualParent.add(entity.root)
    // TODO: fix collisions by applying this code (that used to be in Entity) here
    // if (this.opts.collides) {
    //   entity.root.traverse(o => o.layers.enable(1))
    // }
    if (entity.onAddEntity) {
      entity.onAddEntity(this, actualParent)
    }
  }

  removeEntity (entity, parent) {
    let actualParent = parent ? parent : this.scene
    actualParent.remove(entity.root)
    if (entity.onRemoveEntity) {
      entity.onRemoveEntity(this, actualParent)
    }
  }

  onDomReady () {
    document.body.appendChild(this.renderer.domElement)
    HtmlMixerHelpers.attachDomElements(this.htmlMixer, document.body)
  }

  onWindowResize () {
    const w = window.innerWidth; const h = window.innerHeight

    this.renderer.setSize(w, h)
    this.updateCamera(w, h)
    this.htmlMixer.setSizeWithCamera(w, h, this.camera)
    this.fitBackgroundToScreen(w, h)
  }
  
  createCamera (w, h) {
    const camera = new PerspectiveCamera(perspectiveRatio, w / h, 1500, 12800 * ISOMETRY)
    camera.position.copy(cameraIdealPosition)
    camera.lookAt(0, 0, 0)
    return camera
  }

  updateCamera (w, h) {
    // Zoom based on device orientation / landscape / portrait
    this.camera.aspect = w / h
    this.camera.fov = perspectiveRatio / MathUtils.clamp(w / h / 1.78, 0.6, 1.5)
    this.camera.updateProjectionMatrix()
  }

  fitBackgroundToScreen (w, h) {
    const bg = this.background
    var repeatX, repeatY
    repeatX = w * bg.image.height / (h * bg.image.width)

    if (repeatX > 1) {
      // fill the width and adjust the height accordingly
      repeatX = 1
      repeatY = h * bg.image.width / (w * bg.image.height)
      bg.repeat.set(repeatX, repeatY)
      bg.offset.y = (repeatY - 1) / 2 * -1
    } else {
      // fill the height and adjust the width accordingly
      repeatX = w * bg.image.height / (h * bg.image.width)
      repeatY = 1
      bg.repeat.set(repeatX, repeatY)
      bg.offset.x = (repeatX - 1) / 2 * -1
    }
  }

}

export { Stage, cameraIdealPosition }