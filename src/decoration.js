const {
  TextureLoader,
  PlaneBufferGeometry,
  MeshPhongMaterial,
  Mesh,
  RepeatWrapping,
  Raycaster,
  Vector3
} = THREE

import { DummyObject } from './dummy_object'

class Decoration {
  constructor (imagePath, opts) {
    if (typeof imagePath === 'string') {
      this.imagePath = imagePath
    } else {
      this.useTexture(imagePath)
    }
    this.opts = Object.assign({
      defaultScale: 1.0, // Number
      defaultCenter: null, // {x, y, z}
      bottom: 0.0
    }, opts)
  }

  /**
   * Calculate the "center" of the decoration, where it touches the ground
   *
   * @param {Number} height   The total height of the decoration (i.e. usually the image height)
   */
  calculateCenter (height, scale) {
    const center = {
      x: 0.0,
      y: height / 2.0 - this.opts.bottom,
      z: 0.0
    }
    if (this.opts.defaultCenter) {
      Object.assign(center, this.opts.defaultCenter)
    }

    // Scale
    center.x = center.x * scale
    center.y = center.y * scale
    center.z = center.z * scale

    return center
  }

  useTexture (texture) {
    texture.repeat.set(1, 1)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    this.texture = texture

    this.geometry = new PlaneBufferGeometry(
      texture.image.width,
      texture.image.height
    )

    this.material = new MeshPhongMaterial({
      color: 0xffffff,
      map: texture,
      alphaTest: 0.9
    })
    this.loaded = true

  }

  load () {
    return new Promise((resolve, reject) => {
      var success = (texture) => {
        this.useTexture(texture)
        resolve(this.material)
      }
      // `load` no longer supports onProgress callback as 3rd arg, so pass null
      new TextureLoader().load(this.imagePath, success, null, reject)
    })
  }

  cloneAt (x, z, scale, ground) {
    const s = scale || this.opts.defaultScale

    // Unless there's a defaultCenter, use the image's height to determine its "bottom"
    this.center = this.calculateCenter(this.texture.image.height, s)

    var mesh = new Mesh(this.geometry, this.material)
    mesh.receiveShadow = true
    // Default rotation
    mesh.rotation.x = -Math.PI
    mesh.rotation.z = Math.PI

    Object.assign(mesh.position, this.center)

    mesh.translateX(x)
    mesh.translateZ(z)

    // put this on the ground plane:

    var verticalLineTop = new Vector3(-x, 10000, -z)
    var verticalLineBottom = new Vector3(0, -1, 0) // must be normalized to length 1, ie .normalize ()
    // verticalLineTop.add(this.moveTarget.position)

    var checkGroundRay = new Raycaster(verticalLineTop, verticalLineBottom, 0, 40000)
    // console.log("Finished making new Raycaster (checkGroundRay) for X: "+-x+" , Z: "+-z);
    var checkGroundIntersects = checkGroundRay.intersectObject(ground)
    // console.log("checkGroundIntersects",checkGroundIntersects);
    if (checkGroundIntersects.length > 0) {
      // console.log("checkGroundIntersects FOUND: checkGroundIntersects[0].point.y",checkGroundIntersects[0].point.y);
      mesh.translateY(checkGroundIntersects[0].point.y)
      // mesh.position.y = checkGroundIntersects[0].point.y*0.5
    }

    mesh.scale.multiplyScalar(s)

    this.mesh = mesh
    return mesh
  }
}

async function addRandomDecorationsToScene (scene, ground, random) {
  const forestSize = ground.groundSizeX
  const decorationopts = [
    {
      // Green Tree
      count: 75,
      scale: 1.0,
      template: new Decoration('tree01.png', {
        bottom: 25.0
      })
    },
    {
      // Yellow Tree
      count: 50,
      scale: 1.0,
      template: new Decoration('tree04.png', {
        bottom: 25.0
      })
    },
    {
      // Hollow Stump
      count: 30,
      scale: 1.0,
      template: new Decoration('tree06.png', {
        bottom: 25.0
      })
    },
    {
      // Tree 07
      count: 20,
      scale: 1.0,
      template: new Decoration('tree07.png', {
        bottom: 25.0
      })
    },
    {
      // Rock
      count: 62,
      scale: 0.5,
      template: new Decoration('rock02.png', {
        bottom: 130.0
      })
    },
    {
      // Stump
      count: 12,
      scale: 0.6,
      template: new Decoration('tree05.png', {
        bottom: 30.0
      })
    },
    {
      // Shrub
      count: 75,
      scale: 0.65,
      template: new Decoration('plant02.png', {
        bottom: 45.0
      })
    },
    {
      // Mushrooms
      count: 17,
      scale: 0.5,
      template: new Decoration('plant04.png', {
        bottom: 120.0
      })
    }
  ]

  const forestRange = (value) => value * forestSize - (forestSize / 2.0)
  for (const decSetting of decorationopts) {
    for (let i = 0; i < decSetting.count * 1; i++) {
      var x = forestRange(random())
      var z = forestRange(random())
	  // let scale = 0.1;
      let scale = Math.pow(random(), 4) * 0.4 + 0.6
      scale = scale * (decSetting.scale || 1.0)

      await decSetting.template.load()
      const mesh = decSetting.template.cloneAt(x, z, scale, ground)
      scene.add(mesh)

      const collisionMesh = new DummyObject({visible: true, w: 100, h: 700, l: 100})
      collisionMesh.material.visible = false
      mesh.getWorldPosition(collisionMesh.position)
      collisionMesh.translateY(-700)
      collisionMesh.layers.enable(1)
      scene.add(collisionMesh)
    }
  }
}

export { Decoration, addRandomDecorationsToScene }
