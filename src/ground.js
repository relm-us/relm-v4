import { ImprovedNoise } from './lib/ImprovedNoise.js'

const {
  PlaneBufferGeometry,
  MeshPhongMaterial,
  Mesh,
  RepeatWrapping,
  sRGBEncoding,
  Color,
  BufferAttribute
} = THREE

function createGround (scene, groundSize) {
  const geometry = new PlaneBufferGeometry(groundSize, groundSize)

  geometry.rotateX(-Math.PI / 2)
  
  const material = new MeshPhongMaterial({
    color: 0xAAAAAA,
  })

  const ground = new Mesh(geometry, material)
  ground.rotation.x = -Math.PI
  ground.rotation.z = +Math.PI
  ground.position.y -= 420
  ground.scale.y = 14
  // note that because the ground does not cast a shadow, .castShadow is left false
  ground.receiveShadow = true
  ground.texturedMaterials = [material]

  scene.attach(ground)
  
  return ground
}

function createGround2(scene, groundSize) {
  const texturedMaterials = []

  // setup terrain

  var mapDensityX = 70
  var mapDensityY = 70
  var worldWidth = Math.floor((mapDensityX / 2) * (groundSize / 6000)); var worldDepth = Math.floor((mapDensityY / 2) * (groundSize / 6000)); var mountainHeight = 0.4
  // console.log("worldWidth:",worldWidth);

  var geometry = new PlaneBufferGeometry(groundSize, groundSize, worldWidth - 1, worldDepth - 1)
  // var geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
  geometry.rotateX(-Math.PI / 2)

  var size = worldWidth * worldDepth; var data = new Uint8Array(size)
  var perlin = new ImprovedNoise(); var quality = 0.83; var z = 0.255 * 100

  for (var j = 0; j < 3; j++) {
    for (var i = 0; i < size; i++) {
      var x = i % worldWidth; var y = ~~(i / worldWidth)
      data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * mountainHeight)
    }
    quality *= 3.3
  }

  // build island circle shape
  var sinStartPos = 5 * (worldWidth / 70)
  var sinSculptRate = 18 * (worldWidth / 70)

  for (var i = 0; i < size; i++) {
    var x = i % worldWidth; var y = ~~(i / worldWidth)
    var buildIslandCircleShape = Math.abs(Math.sin((x - sinStartPos) / sinSculptRate) * 2 + Math.sin((y - sinStartPos) / sinSculptRate) * 2)
    data[i] += buildIslandCircleShape
    // eliminate island edge artifacts
    if (x === 0 || y === 0 || x === worldWidth - 1 || y === worldDepth - 1) data[i] = 0
    if (x === 1 || y === 1 || x === worldWidth - 2 || y === worldDepth - 2) {
      if (data[i] > 1) {
        data[i] = 1
      }
    }

    // console.log("x",x);
    // console.log("y",y);
  }
  // console.log("--");

  var vertices = geometry.attributes.position.array

  for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i] * 10
  }

  geometry.computeFaceNormals()
  geometry.computeVertexNormals()

  // try vertex shading

  // setup vertex color array by counting vertices and adding the array
  var count = geometry.attributes.position.count
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(count * 3), 3))

  var color = new Color()
  var positions = geometry.attributes.position
  var colors = geometry.attributes.color

  const yellowHue = 0.16
  const greenHue = 0.28
  for (var i = 0; i < count; i++) {
    color.setHSL(
      greenHue - ((positions.getY(i) - 32) * 0.0045),
      0.7 - ((positions.getY(i) - 32) * 0.020),
      0.23 + ((positions.getY(i) - 32) * 0.015)
    )

    colors.setXYZ(i, color.r, color.g, color.b)
    if (positions.getY(i) === 20) colors.setXYZ(i, 0.8, 0.8, 0.3)
    if (positions.getY(i) === 10) colors.setXYZ(i, 0.2, 0.6, 0.6)
  }

  // create fastGroundCheckerArray
  var i = 0
  var fastGroundCheckerArray = new Array()
  for (x = 0; x < worldWidth; x++) {
    fastGroundCheckerArray[x] = new Array()
    for (y = 0; y < worldDepth; y++) {
      fastGroundCheckerArray[x][y] = positions.getY(i)
      i++
    }
  }
  // console.log("COMPLETE! fastGroundCheckerArray",fastGroundCheckerArray);

  var material = new MeshPhongMaterial({
    color: 0xffffff,
    flatShading: false,
    vertexColors: true,
    shininess: 0,
    // map: texture
  })
  texturedMaterials.push(material)

  // tint everything:
  // material.color.r = 0.55/1.5
  // material.color.g = 1.05/1.5
  // material.color.b = 0.20/1.5

  var ground = new Mesh(geometry, material)
  ground.rotation.x = -Math.PI / 1
  ground.rotation.z = +Math.PI
  ground.position.y -= 420
  ground.scale.y = 1 * 14
  ground.scale.x = ground.scale.x / 1
  ground.scale.y = ground.scale.y / 1
  ground.scale.z = ground.scale.z / 1
  // note that because the ground does not cast a shadow, .castShadow is left false
  ground.receiveShadow = true

  scene.attach(ground)

  // water + ocean (blue)  (surface 1)

  var geometry = new PlaneBufferGeometry(groundSize, groundSize, 1, 1)
  var material = new MeshPhongMaterial({
    color: 0x2255BB,
    flatShading: false,
    vertexColors: false,
    shininess: 0,
    // map: texture,
    opacity: 0.5,
    transparent: true
  })
  texturedMaterials.push(material)
  var water = new Mesh(geometry, material)
  water.rotation.x = -Math.PI / 2
  water.rotation.z = +Math.PI
  water.position.y -= 200
  // water.scale.y = 1 * 14
  water.scale.x = water.scale.x * 3
  water.scale.y = water.scale.y * 3
  water.scale.z = water.scale.z * 3
  // note that because the water does not cast a shadow, .castShadow is left false
  // water.receiveShadow = true
  water.renderOrder = 1
  scene.attach(water)

  // water + ocean (blue)  (surface 2)

  var geometry2 = new PlaneBufferGeometry(groundSize, groundSize, 1, 1)
  var material2 = new MeshPhongMaterial({
    color: 0x2255BB,
    flatShading: false,
    vertexColors: false,
    shininess: 0,
    opacity: 0.5,
    transparent: true
  })
  var water2 = new Mesh(geometry, material)
  water2.rotation.x = -Math.PI / 2
  water2.rotation.z = +Math.PI
  water2.position.y -= 215
  // water.scale.y = 1 * 14
  water2.scale.x = water.scale.x * 3
  water2.scale.y = water.scale.y * 3
  water2.scale.z = water.scale.z * 3
  // note that because the water does not cast a shadow, .castShadow is left false
  // water2.receiveShadow = true

  scene.attach(water2)

  // bottom of ocean (solid?)

  var geometry = new PlaneBufferGeometry(groundSize, groundSize, 1, 1)
  var material = new MeshPhongMaterial({
    color: 0x2255BB,
    flatShading: false,
    vertexColors: false,
    shininess: 0
  })
  var oceanBottom = new Mesh(geometry, material)
  oceanBottom.rotation.x = -Math.PI / 2
  oceanBottom.rotation.z = +Math.PI
  oceanBottom.position.y -= 230
  // water.scale.y = 1 * 14
  oceanBottom.scale.x = oceanBottom.scale.x * 3
  oceanBottom.scale.y = oceanBottom.scale.y * 3
  oceanBottom.scale.z = oceanBottom.scale.z * 3
  // note that because the oceanBottom does not cast a shadow, .castShadow is left false

  scene.attach(oceanBottom)

  ground.fastGroundCheckerArray = fastGroundCheckerArray
  ground.groundSize = groundSize
  ground.texturedMaterials = texturedMaterials
  return ground
}

export { createGround }
