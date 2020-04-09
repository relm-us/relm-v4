import { Entity } from './entity'
// import { Vector3 } from 'three'

class MeshEntity extends Entity {
  constructor (object, opts) {
    super(opts)
    
    if (object && object.clone) {
      this.mesh = object.clone()
      this.initializeMesh()
      this.root.add(this.mesh)
    } else {
      console.error('Unable to clone object as mesh', object)
    }
  }

  initializeMesh () {
    const size = new THREE.Vector3()
    this.mesh.geometry.boundingBox.getSize(size)

    this.mesh.geometry.center() // center the geometry
    this.mesh.geometry.translate(0, size.y / 2, 0) // translate so it's bottom is on the ground

    let ry = -Math.PI / 4
    if ('rotate' in this.opts) {
      ry -= Math.PI / 2 * this.opts.rotate
    }
    this.mesh.rotateY(ry) // rotate so it's 2.5d perspective

    this.mesh.scale.set(this.opts.scale, this.opts.scale, this.opts.scale) // scale so it's life-size (TODO: make this come from opts)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    if (this.mesh.material) {
      this.mesh.material.metalness = 0.0
    }
  }
}


export { MeshEntity }
