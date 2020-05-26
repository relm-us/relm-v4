import stampit from 'stampit'
import FlatQueue from 'flatqueue'
const millis = Date.now

THREE.Cache.enabled = true

const texture = new THREE.TextureLoader().load( "/marble-tile.jpg" ) //checkered.png" )
// const texture = window.texture = THREE.DefaultLoadingManager.load('/marble-tile.jpg')
window.texture = texture
console.log(texture)


