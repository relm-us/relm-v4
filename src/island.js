import { Entity } from './entity.js'
import { MeshEntity } from './mesh_entity.js'
import { HomeSettings } from './home_settings.js'

const SKYREALM_HEIGHT = 5000

class Island extends Entity {
  constructor (rsrc, props, opts) {
    super(opts)

    this.props = props

    this.resources = {
      house: rsrc.getObject('town', 'House_01_FantasyAtlas_mat_0'),
      island: rsrc.getObject('island', 'Object012'),
    }

    this.root.position.set(0, SKYREALM_HEIGHT, 0)

    this.createIsland()
    this.createHouse()
    this.createHomeSettings()
  }

  createIsland () {
    this.island = new MeshEntity(this.resources.island, {
      rotate: 0,
      scale: 4 * 3.5,
    })
    this.island.root.position.set(-80, -1250, 10)
    this.root.add(this.island.root)
  }

  createHouse () {
    this.house = new MeshEntity(this.resources.house, {
      rotate: 1,
      scale: 3
    })
    this.root.add(this.house.root)
  }

  createHomeSettings () {
    this.homeSettings = new HomeSettings(
        -500, 5000 + 150, -100, Object.assign({
        rotate: 2,
      }, this.props)
    )
    window.homeSettings = this.homeSettings
  }

  moveTo (position) {
    this.root.position.x = position.x
    this.root.position.z = position.z

    this.homeSettings.mixerPlane.object3d.position.x = position.x - 500
    this.homeSettings.mixerPlane.object3d.position.z = position.z - 100
  }

  onAddEntity(stage) {
    stage.addEntity(this.homeSettings, this.root)
  }

  onRemoveEntity(stage) {
    stage.removeEntity(this.homeSettings, this.root)
  }
}

export { Island }
