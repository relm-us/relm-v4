// Creates links out of URLs
import anchorme from 'anchorme'
// Prevents XSS attacks in shared text messages
import DOMPurify from 'dompurify'

import { checkOverflow } from "./util.js"

class ThoughtBubble {
  constructor(camera, actionCallback, closeCallback) {
    this.camera = camera
    this.text = null
    this.diameter = 0
    this.enableCircle = true
    this.enableDots = true
    this.enableCloseIcon = true
    this.enableActionIcon = true
    this.alignCenter = false
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
  
  switchToCircle() {
    if (this.divElement) {
      this.divElement.classList.add('circle-text')
      this.divElement.classList.remove('rectangle-text')
    }
  }
  
  switchToRectangle() {
    if (this.divElement) {
      this.divElement.classList.add('rectangle-text')
      this.divElement.classList.remove('circle-text')
    }
  }

  showDots() {
    [this.dot1, this.dot2].forEach(dot => {
      if (dot) {
        dot.classList.remove('hide')
      }
    })
  }
  
  hideDots() {
    [this.dot1, this.dot2].forEach(dot => {
      if (dot) {
        dot.classList.add('hide')
      }
    })
  }
  
  showCloseIcon() {
    this.closeIcon.classList.remove('hide')
  }

  hideCloseIcon() {
    this.closeIcon.classList.add('hide')
  }
  
  showActionIcon() {
    this.actionIcon.classList.remove('hide')
  }

  hideActionIcon() {
    this.actionIcon.classList.add('hide')
  }
  
  switchToCenterAligned() {
    this.domElement.classList.add('centered')
  }

  switchToLeftAligned() {
    this.domElement.classList.remove('centered')
  }
  
  getDiameterForCircleOfText(text) {
    // W x H = area of a rectangle
    // PI * r^2 = area of a circle
    // so to find out how big of a thought bubble we need to create, we
    // equate the two (W x H = PI * r^2) and then solve for 'r' (the radius):
    const size = this.getTextDimensions(text)
    const area = size.width * size.height
    const extraSpace = 30 // add a little so bubbles are a bit bigger than they need to be
    const radius = Math.ceil(Math.sqrt(area / Math.PI) + extraSpace) 

    return radius * 2
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

    if (this.enableDots) {
      this.showDots()
    } else {
      this.hideDots()
    }

    if (this.enableCloseIcon) {
      this.showCloseIcon()
    } else {
      this.hideCloseIcon()
    }
    
    if (this.enableActionIcon) {
      this.showActionIcon()
    } else {
      this.hideActionIcon()
    }
    
    if (this.alignCenter) {
      this.switchToCenterAligned()
    } else {
      this.switchToLeftAligned()
    }

    const cleanText = DOMPurify.sanitize(text)
    const clickableText = anchorme({input: cleanText,
      options: {
        truncate: 30,
        middleTruncation: true,
        attributes: {
          target: '_blank',
        },
      },
    })
    
    this.diameter = this.getDiameterForCircleOfText(text)
    if (this.enableCircle) {
      // Reset to 'circle' bubble, optimistic that text will fit
      this.switchToCircle()
      // This is the thought bubble element inside the domElement wrapper
      this.divElement.style.width = this.diameter + 'px'
      this.divElement.style.height = this.diameter + 'px'
      
      const padding = 5
      // If it's a short message, try to center it inside the bubble
      if (text.length < 50) {
        this.spanElement.innerHTML = `<p>${clickableText}</p>`
      } else {
        this.spanElement.innerHTML = `${clickableText}`
      }
    } else {
      this.switchToRectangle()
      this.spanElement.innerHTML = `${clickableText}`
    }

    // If the clearText was called, make sure the thought bubble is now visible
    this.domElement.style.display = ''

    // createDomElement() doesn't attach the wrapper div to the document body
    if (!this.domElement.parentElement) {
      document.body.appendChild(this.domElement)
    }

    if (checkOverflow(this.divElement)) {
      // Text won't fit in circle, so we must resort to a rectangle form
      this.switchToRectangle()
      this.divElement.style.width = this.diameter + 'px'
      this.divElement.style.height = this.diameter + 'px'
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
    div.classList.add('speech-text')
    // NOTE: This event listener prevents users from highlighting text (not yet sure why)
    // div.addEventListener('mousedown', (event) => {
    //   event.preventDefault()
    //   actionCallback(this, event)
    // })
    wrapper.appendChild(div)

    const closeIcon = this.closeIcon = document.createElement('div')
    closeIcon.classList.add('thought-bubble-close')
    closeIcon.classList.add('close')
    closeIcon.addEventListener('mousedown', (event) => {
      event.preventDefault()
      closeCallback(this, event)
    })
    wrapper.appendChild(closeIcon)
    
    const actionIcon = this.actionIcon = document.createElement('div')
    actionIcon.classList.add('thought-bubble-action')
    actionIcon.addEventListener('mousedown', (event) => {
      event.preventDefault()
      actionCallback(this, event)
    })
    wrapper.appendChild(actionIcon)
    
    // The "dots" here are the little visual thought bubble dots in comics
    const dot1 = this.dot1 = document.createElement('div')
    dot1.classList.add('thought-dot-1')
    wrapper.appendChild(dot1)

    const dot2 = this.dot2 = document.createElement('div')
    dot2.classList.add('thought-dot-2')
    wrapper.appendChild(dot2)

    const span = document.createElement('span')
    div.appendChild(span)

    this.domElement = wrapper
    this.divElement = div
    this.spanElement = span
  }
}

export { ThoughtBubble }