import stampit from 'stampit'

const VisibleEdges = stampit({
  init({ object, color = 0xffffff, enabled = false }) {
    this._object = object
    this._color = color
    this.enabled = false
    this.lines = []

    if (enabled) {
      this.enable()
    }
  },

  methods: {
    enable() {
      this.enabled = true
      this._createEdges()
    },

    disable() {
      this.enabled = false
      this._removeLineSegments()
    },
    
    rebuild() {
      if (this.enabled) {
        this._createEdges()
      }
    },

    getObject() {
      if (typeof this._object === 'function') {
        return this._object()
      } else {
        return this._object
      }
    },

    _removeLineSegments() {
      this.lines.forEach(line => {
        if (line.parent) {
          line.parent.remove(line)
        }
      })
    },

    _findMeshes() {
      const meshes = []
      this.getObject().traverse(o => {
        if (o.isMesh) {
          meshes.push(o)
        }
      })
      return meshes
    },

    _createEdges() {
      this._removeLineSegments()
      
      const meshes = this._findMeshes()
      for (const mesh of meshes) {
        const geometry = new THREE.EdgesGeometry(mesh.geometry)
        const material = new THREE.LineBasicMaterial({ color: this._color})
        const line = new THREE.LineSegments(geometry, material)
        
        mesh.add(line)
        this.lines.push(line)
      }
      if (meshes.length === 0) {
        console.warn("Can't show VisibleEdges of object, no geometry found", object)
      }
    }
  }
})

export { VisibleEdges }