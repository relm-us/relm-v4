import { HtmlMixer, HtmlMixerHelpers } from './lib/HtmlMixer.js'
import { Entity } from './entity.js'

class RemoteDesktopPortal extends Entity {
  constructor(url, x, y, opts) {
    super(opts)
    
    this.url = url
    this.x = x
    this.y = y

    this.opts = Object.assign({
      scale: 500.0,
      rotate: 0
    }, opts || {})
  }

  createMixerPlane(htmlMixer) {
    let ry = -Math.PI / 4
    if ('rotate' in this.opts) {
      ry -= Math.PI / 2 * this.opts.rotate
    }

    var domElement = HtmlMixerHelpers.createIframeDomElement(this.url)
    this.mixerPlane = new HtmlMixer.Plane(htmlMixer, domElement)
    this.mixerPlane.object3d.position.x = this.x
    this.mixerPlane.object3d.position.y = this.y
    this.mixerPlane.object3d.rotation.y = ry
    this.mixerPlane.object3d.scale.x = this.opts.scale
    this.mixerPlane.object3d.scale.y = this.opts.scale
  }

  onAddEntity(stage) {
    this.createMixerPlane(stage.htmlMixer)
    stage.scene.add(this.mixerPlane.object3d)
  }

  onRemoveEntity(stage) {
    stage.scene.remove(this.mixerPlane.object3d)
  }
}

export { RemoteDesktopPortal }