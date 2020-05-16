import { MeshoptGLTFLoader } from './lib/MeshoptGLTFLoader.js'
import { GLTFLoader } from './lib/GLTFLoader.js'
import { MeshoptDecoder } from './lib/meshopt_decoder.js'

// Loader for regular GLTFs and GLBs
const regularGLTFLoader = new GLTFLoader()

// Loader for 'Compressed' GLTFs and GLBs
// https://github.com/KhronosGroup/glTF/pull/1702
const meshoptGLTFLoader = new MeshoptGLTFLoader()
meshoptGLTFLoader.setMeshoptDecoder(MeshoptDecoder);

// Loader for Textures
const textureLoader = new THREE.TextureLoader()

const manifestMeta = {
  'TextureLoader': [
    ['marble', 'marble-tile.jpg'],
    ['sparkle', 'sparkle_blue.png'],
  ],
  'RegularGLTFLoader': [
    // ['town', 'town.glb'],
    // ['island', 'oneisland.glb'],
  ],
  'MeshoptGLTFLoader': [
    ['people', 'people-packed.glb']
  ]
}

const loaderNameLookup = {
  'TextureLoader': textureLoader,
  'RegularGLTFLoader': regularGLTFLoader,
  'MeshoptGLTFLoader': meshoptGLTFLoader,
}

const addManifestTo = (resourceLoader) => {
  for (let loaderName in manifestMeta) {
    const loader = loaderNameLookup[loaderName]
    for (let meta of manifestMeta[loaderName]) {
      // e.g. add('people', meshoptGLTFLoader, 'people-packed.glb')
      resourceLoader.add(meta[0], loader, meta[1])
    }
  }
}

const addDynamicImageTo = async (resourceLoader, id, path) => {
  resourceLoader.add(id, textureLoader, path)
  return await resourceLoader.getAsync(id)
}

const addDynamicGltfTo = async (resourceLoader, id, path) => {
  resourceLoader.add(id, regularGLTFLoader, path)
  return await resourceLoader.getAsync(id)
}

export { addManifestTo, addDynamicImageTo, addDynamicGltfTo }
