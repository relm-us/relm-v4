class ThoughtBubble {
  constructor(camera, actionCallback, closeCallback) {
    this.camera = camera
    this.text = null
    this.diameter = 0
    this.position = new THREE.Vector3(0, 0, 0)
    this.screenPosition = new THREE.Vector3()
    this.createDomElement(actionCallback, closeCallback)
  }

  project(screenWidth, screenHeight, offsetX = 0, offsetY = 0) {
    this.screenPosition.copy(this.position)
    
    this.screenPosition.project( this.camera ); 
    this.screenPosition.x = (this.screenPosition.x + 1) * screenWidth / 2 + offsetX
    this.screenPosition.y = -(this.screenPosition.y - 1) * screenHeight / 2 + offsetY
    this.screenPosition.z = 0

    this.domElement.style.left = this.screenPosition.x + 'px'
    this.domElement.style.top = this.screenPosition.y + 'px'
  }

  getContext() {
    if (!this.context2d) {
      this.context2d = document.createElement('canvas').getContext('2d')
      this.context2d.font = '14px sans-serif'
    }
    return this.context2d
  }

  getTextDimensions(text) {
    const ctx = this.getContext()
    const measurement = ctx.measureText(text)
    return {
      width:  measurement.actualBoundingBoxRight - 
              measurement.actualBoundingBoxLeft,
      height: measurement.actualBoundingBoxAscent - 
              measurement.actualBoundingBoxDescent,
      measurement
    }
  }

  setText(text) {
    if (!text) {
      this.clearText()
      return
    }
    
    this.text = text
    if (!this.spanElement) {
      console.error("SPAN element must exist prior to setText call")
      return
    }

    // W x H = area of a rectangle
    // PI * r^2 = area of a circle
    // so to find out how big of a thought bubble we need to create, we
    // equate the two (W x H = PI * r^2) and then solve for 'r' (the radius):
    const size = this.getTextDimensions(text)
    const area = size.width * size.height
    const padding = 5
    const extraSpace = 30 // add a little so bubbles are a bit bigger than they need to be
    const radius = Math.ceil(Math.sqrt(area / Math.PI) + extraSpace) 

    this.diameter = radius * 2

    // This is the thought bubble element inside the domElement wrapper
    this.divElement.style.width = this.diameter + 'px'
    this.divElement.style.height = this.diameter + 'px'

    // Remove all <br> elements and text nodes
    this.spanElement.innerHTML = ''

    this.textNode = document.createTextNode(text)
    // If it's a short message, center it inside the bubble
    if (size.width < this.diameter - padding * 2) {
      this.spanElement.classList.add('circle-text-center')
    } else {
      this.spanElement.classList.remove('circle-text-center')
    }
    this.spanElement.appendChild(this.textNode)

    // If the clearText was called, make sure the thought bubble is now visible
    this.domElement.style.display = ''

    // createDomElement() doesn't attach the wrapper div to the document body
    if (!this.domElement.parentElement) {
      document.body.appendChild(this.domElement)
    }
  }

  clearText() {
    this.text = null
    this.domElement.style.display = 'none'
  }

  createDomElement(actionCallback, closeCallback) {
    const wrapper = document.createElement('div') 
    wrapper.classList.add('thought-bubble')
    
    const div = document.createElement('div') 
    div.classList.add('circle-text')
    div.addEventListener('click', (event) => {
      actionCallback(this, event)
    }, true)
    wrapper.appendChild(div)

    const bubble1 = document.createElement('div')
    bubble1.classList.add('thought-bubble-1')
    wrapper.appendChild(bubble1)

    const bubble2 = document.createElement('div')
    bubble2.classList.add('thought-bubble-2')
    wrapper.appendChild(bubble2)

    const closeIcon = document.createElement('div')
    closeIcon.classList.add('thought-bubble-close')
    closeIcon.classList.add('close')
    closeIcon.addEventListener('click', (event) => {
      closeCallback(this, event)
    }, true)
    wrapper.appendChild(closeIcon)

    const span = document.createElement('span')
    div.appendChild(span)

    this.domElement = wrapper
    this.divElement = div
    this.spanElement = span
  }
}

export { ThoughtBubble }