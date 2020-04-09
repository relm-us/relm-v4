class Label {
  constructor(object, camera) {
    this.object = object
    this.text = "none"
    this.camera = camera
    this.vector = new THREE.Vector3()
    this.domElement = null
  }


  project(text, position, screen) {
    if (text != this.text) {
      this.updateText = true
      this.text = text
    }

    this.vector.copy(position)

    this.vector.project( this.camera ); 
    this.vector.x = (this.vector.x + 1) * screen.width / 2
    this.vector.y = -(this.vector.y - 1) * screen.height / 2
    this.vector.z = 0

    this.updateDomElement()
  }

  createDomElement () {
    this.domElement = document.createElement('div')
    this.domElement.classList.add('entity-label')
    this.domElement.textContent = this.text
    document.body.appendChild(this.domElement)
  }

  destroyDomElement () {
    if (this.domElement) {
      this.domElement.remove()
    }
  }

  updateDomElement () {
    if (!this.domElement) {
      this.createDomElement()
    }

    if (this.updateText) {
      this.domElement.textContent = this.text
      this.updateText = false
    }

    this.domElement.style.left = this.vector.x + 'px'
    this.domElement.style.top = this.vector.y + 'px'
  }
}

export { Label }