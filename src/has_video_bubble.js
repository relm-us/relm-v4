import stampit from 'stampit'
import { Component } from './component.js'
import { CanProject, UpdateCollision } from './label.js'

const { Vector3 } = THREE

const VIDEO_BUBBLE_DIAMETER = 200

const WithVideoBubble = stampit(UpdateCollision, {
  init({ body }) {
    this.domElement = null
    this.documentBody = body || document.body
  },
  
  methods: {
    createDomElement() {
      const element = document.createElement('video')
      element.classList.add('video-feed')
      element.setAttribute('autoplay', 1)
      // element.id = id
      element.addEventListener('loadedmetadata', (metadata) => {
        const w = element.videoWidth
        const h = element.videoHeight
        if (w > h) {
          element.style.width = `${VIDEO_BUBBLE_DIAMETER * w / h}px`
          element.style.height = `${VIDEO_BUBBLE_DIAMETER}px`
        } else {
          element.style.width = `${VIDEO_BUBBLE_DIAMETER}px`
          element.style.height = `${VIDEO_BUBBLE_DIAMETER * h / w}px`
        }
      })
      
      const wrapper = this.domElement = document.createElement('div')
      wrapper.classList.add('video-wrapper')
      wrapper.appendChild(element)

      this.documentBody.appendChild(wrapper)
      return element
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
    update(delta) {
      this.videoBubble.position.copy(this.object.position)
      this.videoBubble.position.add(this.videoBubble.offset)
      
      const screenSize = { width: this.stage.width, height: this.stage.height }
      this.videoBubble.object.project(this.videoBubble.position, this.stage.camera, screenSize)
    }
  }
})



export { HasVideoBubble }