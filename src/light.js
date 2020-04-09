const { AmbientLight, DirectionalLight } = THREE
const ambientFactor = 2.3

function createAmbientLight () {
  return new AmbientLight(0xFFFFFF, 0.33 * ambientFactor)
}

function createDirectionalLight () {
  const light = new DirectionalLight(0xffffff, 1.10 / ambientFactor)

  light.position.set(-180, 450, -220)

  // Shadow not working properly, so turning this code off for now:
  /* light.castShadow = true

  light.shadow.radius = 0// 512/4;

  light.shadow.mapSize.width = 92// 512/4;
  light.shadow.mapSize.height = 88// 512/4;

  light.shadow.camera.near = 100
  light.shadow.camera.far = 1200

  light.shadow.camera.left = -75
  light.shadow.camera.right = 75
  light.shadow.camera.top = 125
  light.shadow.camera.bottom = -85

  light.shadow.bias = -0.018 */

  return light
}

export { createAmbientLight, createDirectionalLight }
