import stampit from 'stampit'

const VisibleEdges = stampit({
  init({ object, enabled = false }) {
    this.object = object
    this.enabled = false

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
      this.object.remove(this.lines)
    },
    
    rebuild() {
      if (this.enabled) {
        this._createEdges()
      }
    },

    _findGeometry() {
      let mesh
      this.object.traverse(o => {
        if (o.isMesh) { mesh = o }
      })
      if (mesh) return mesh.geometry
    },

    _createEdges() {
      if (this.lines) { this.object.remove(this.lines) }
      
      const geometry = this._findGeometry()
      if (geometry) {
        const edges = new THREE.EdgesGeometry(geometry)
        this.lines = new THREE.LineSegments(edges,
          new THREE.LineBasicMaterial({ color: 0xffffff })
        )
        
        this.object.add(this.lines)
      } else {
        console.warn("Can't show VisibleEdges of object, no geometry found", this.object)
      }
    }
  }
})

export { VisibleEdges }