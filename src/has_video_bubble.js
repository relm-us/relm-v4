import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { CanProject } from './label.js'

const { Vector3 } = THREE

const WithVideoBubble = stampit(EventEmittable, {
  init({ body, diameter }) {
    this.domElement = null
    this.documentBody = body || document.body
    this.muteButton = null
    this.muted = false
    this.diameter = diameter || 100
  },
  
  methods: {
    show() {
      if (this.domElement) {
        this.domElement.classList.add('show')
        this.domElement.classList.remove('hide')
      }
    },

    hide() {
      if (this.domElement) {
        this.domElement.classList.add('hide')
        this.domElement.classList.remove('show')
      }
    },
    
    setDiameter(d) {
      this.diameter = d
      this.setVideoElementSize()
    },
    
    enterMutedState() {
      if (this.muteButton) {
        this.muteButton.classList.remove('unmuted')
        this.muteButton.classList.add('muted')
      }
      this.muted = true
      this.emit('mute')
    },

    enterUnmutedState() {
      if (this.muteButton) {
        this.muteButton.classList.remove('muted')
        this.muteButton.classList.add('unmuted')
      }
      this.muted = false
      this.emit('unmute')
    },
    
    setVideoElementSize() {
      const video = this.video
      const circle = this.circle
      
      if (this.video && this.circle) {
        const w = video.videoWidth
        const h = video.videoHeight
        if (w > h) {
          video.style.width = `${this.diameter * w / h}px`
          video.style.height = `${this.diameter}px`
        } else {
          video.style.width = `${this.diameter}px`
          video.style.height = `${this.diameter * h / w}px`
        }
        circle.style.width = `${this.diameter}px`
        circle.style.height = `${this.diameter}px`
        circle.style.borderRadius = `${this.diameter/2}px`
      } else {
        console.warn('Attempted to set video element size, but video element does not exist yet')
      }
    },
    
    createDomElement() {
      if (this.domElement) {
        this.destroyDomElement()
      }
      const video = this.video = document.createElement('video')
      video.classList.add('video-feed')
      video.setAttribute('autoplay', 1)
      video.addEventListener('loadedmetadata', (metadata) => {
        this.setVideoElementSize()
      })
      
      const circle = this.circle = document.createElement('div')
      circle.classList.add('video-circle')
      circle.append(video)
      
      const muteButton = this.muteButton = document.createElement('div')
      muteButton.tabIndex = -1
      muteButton.classList.add('mute-button')
      muteButton.classList.add('unmuted')
      muteButton.addEventListener('mousedown', (event) => {
        if (this.muted) {
          this.enterUnmutedState()
        } else {
          this.enterMutedState()
        }
        event.preventDefault()
      })
      
      const wrapper = this.domElement = document.createElement('div')
      wrapper.classList.add('video-wrapper')
      
      wrapper.appendChild(circle)
      wrapper.appendChild(muteButton)
      
      this.documentBody.appendChild(wrapper)
      return video
    },

    destroyDomElement() {
      this.documentBody.removeChild(this.domElement)
      this.domElement = null
    }
  }
})

/**
 * A VideoBubble knows how to .project() itself into a 2D screen and can
 * create it's own `video` tag via createDomElement.
 */
const VideoBubble = stampit(
  CanProject,
  WithVideoBubble
)

/**
 * HasVideoBubble is a Component that can be added to a Player or other
 * in-game entity.
 */
const HasVideoBubble = stampit(Component, {
  deepProps: {
    videoBubble: {
      position: null,
      offset: null,
      object: null
    }
  },

  init({ videoBubbleOffset }) {
    Object.assign(this.videoBubble, {
      position: new Vector3(),
      offset: videoBubbleOffset || new Vector3(),
      object: VideoBubble()
    })
  },
  
  methods: {
    showVideoBubble() {
      this.videoBubble.object.show()
    },

    hideVideoBubble() {
      this.videoBubble.object.hide()
    },

    update(delta) {
      this.videoBubble.position.copy(this.object.position)
      this.videoBubble.position.add(this.videoBubble.offset)
      
      const screenSize = { width: this.stage.width, height: this.stage.height }
      this.videoBubble.object.project(this.videoBubble.position, this.stage.camera, screenSize)
    }
  }
})



export { HasVideoBubble }