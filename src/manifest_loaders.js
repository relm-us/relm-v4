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
    ['skybox', 'ayanarrablueskyfog.jpg'],
    ['grass', 'grasstexture2.jpg'],
    ['green tree', 'tree01.png'],
    ['yellow tree', 'tree04.png'],
    ['hollow stump', 'tree06.png'],
    ['tree7', 'tree07.png'],
    ['rock', 'rock02.png'],
    ['stump', 'tree05.png'],
    ['shrub', 'plant02.png'],
    ['mushroom', 'plant04.png'],
    ['sparkle', 'sparkle_blue.png'],
    ['signpost', 'sign01.png'],
    ['signpole', 'sign02.png'],
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

export { addManifestTo }
