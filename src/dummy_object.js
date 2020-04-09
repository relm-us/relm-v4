const { Mesh, BoxBufferGeometry, MeshNormalMaterial, Object3D } = THREE

function DummyObject ({ visible, w, h, l }, visibleCallback) {
  if (visible) {
    this.geometry = new BoxBufferGeometry(w, h, l)
    this.geometry.translate(0, h, 0)
    this.material = new MeshNormalMaterial()
    this.material.wireframe = true
    this.object = new Mesh(this.geometry, this.material)
    this.object.visible = true
    this.object.dummy = this
    if (visibleCallback) visibleCallback(this)
  } else {
    this.object = new Object3D()
    this.object.dummy = this
  }
  return this.object
}

export { DummyObject }
