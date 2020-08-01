import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'

import { Component } from './component.js'
import { CanProject } from '../label.js'
import { defineGoal } from '../goals/goal.js'
import { setRef } from '../dom_reference.js'

const { Vector3 } = THREE

const WithVideoBubble = stampit(EventEmittable, {
  init({ body, diameter }) {
    this.domElement = null
    this.documentBody = body || document.body
    this.muteButton = null
    this.muted = false
    this.diameter = diameter || 100

    this.onClick = null
    this._isCamera = true
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

    setOnClick(fn) {
      this.onClick = fn
    },

    setOnDrag(fn) {
      this.onDrag = fn
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

    pointerWithinBounds(pos) {
      const bounds = this.domElement.getBoundingClientRect()
      // TODO: make this a circle
      return (
        pos.x >= bounds.left &&
        pos.x <= bounds.right &&
        pos.y >= bounds.top &&
        pos.y <= bounds.bottom
      )
    },

    _sussIsCameraFromClass(circleEl) {
      if (circleEl.classList.contains('camera')) {
        return true
      } else if (circleEl.classList.contains('desktop')) {
        return false
      } else {
        console.warn(
          "Can't adjust video circle, neither 'camera' nor 'desktop'",
          Array.from(circleEl.classList)
        )
        return true
      }
    },

    setVideoElementSize() {
      const video = this.video
      const circle = this.circle

      if (this.video && this.circle) {
        const multiplier = this._isCamera ? 1 : 2
        const diameter = this.diameter * multiplier

        const w = video.videoWidth
        const h = video.videoHeight
        if (w > h) {
          video.style.width = `${(diameter * w) / h}px`
          video.style.height = `${diameter}px`
        } else {
          video.style.width = `${diameter}px`
          video.style.height = `${(diameter * h) / w}px`
        }

        if (this._isCamera) {
          circle.style.width = `${diameter}px`
          circle.style.height = `${diameter}px`

          circle.classList.add('camera')
          circle.classList.remove('desktop')
        } else {
          circle.style.width = video.style.width
          circle.style.height = video.style.height

          circle.classList.add('desktop')
          circle.classList.remove('camera')
        }
      }
    },

    setIsCamera(isCamera) {
      this._isCamera = isCamera
      this.setVideoElementSize()
    },

    createDomElement() {
      if (this.domElement) {
        this.destroyDomElement()
      }
      const video = (this.video = document.createElement('video'))
      video.classList.add('video-feed')
      video.setAttribute('autoplay', 1)
      video.addEventListener('loadedmetadata', (metadata) => {
        this.setVideoElementSize()
      })

      const circle = (this.circle = document.createElement('div'))
      circle.classList.add('video-circle')
      circle.append(video)

      const muteButton = (this.muteButton = document.createElement('div'))
      muteButton.tabIndex = -1
      muteButton.classList.add('mute-button')
      muteButton.classList.add('unmuted')
      muteButton.addEventListener('mousedown', (event) => {
        if (this.muted) {
          this.enterUnmutedState()
        } else {
          this.enterMutedState()
        }

        // Don't take focus away from glcanvas
        event.preventDefault()

        // When hitting 'mute', don't trigger the bubble's onClick action
        event.stopPropagation()
      })

      const wrapper = (this.domElement = document.createElement('div'))
      wrapper.classList.add('video-wrapper')
      setRef(wrapper, this, 'draggable')

      // let dragStart = false
      // let dragLock = false
      // const mouseDragStartPos = { x: 0, y: 0 }
      // const mouseDragNewPos = { x: 0, y: 0 }
      // wrapper.addEventListener('mousedown', (event) => {
      //   mouseDragStartPos.x = event.clientX
      //   mouseDragStartPos.y = event.clientY
      //   dragStart = true
      //   event.preventDefault()
      // })
      // wrapper.addEventListener('mousemove', (event) => {
      //   mouseDragNewPos.x = event.clientX
      //   mouseDragNewPos.y = event.clientY
      //   if (dragStart && distance(mouseDragStartPos, mouseDragNewPos) >= 10) {
      //     dragLock = true
      //   }
      //   if (dragLock && this.onDrag) {
      //     this.onDrag(delta(mouseDragStartPos, mouseDragNewPos))
      //   }
      // })
      // wrapper.addEventListener('mouseup', (event) => {
      //   if (this.onClick) {
      //     this.onClick()
      //   }
      //   dragStart = false
      //   dragLock = false
      // })

      wrapper.appendChild(circle)
      wrapper.appendChild(muteButton)

      this.documentBody.appendChild(wrapper)
      return video
    },

    destroyDomElement() {
      this.documentBody.removeChild(this.domElement)
      this.domElement = null
    },
  },
})

/**
 * A VideoBubble knows how to .project() itself into a 2D screen and can
 * create it's own `video` tag via createDomElement.
 */
const VideoBubble = stampit(CanProject, WithVideoBubble)

/**
 * HasVideoBubble is a Component that can be added to a Player or other
 * in-game entity.
 */
const HasVideoBubble = stampit(Component, {
  deepStatics: {
    goalDefinitions: {
      videoBubbleOffset: defineGoal('vbo', { x: 0, y: 200, z: 0 }),
    },
  },

  deepProps: {
    videoBubble: {
      position: null,
      object: null,
    },
  },

  init() {
    Object.assign(this.videoBubble, {
      position: new Vector3(),
      object: VideoBubble(),
    })
    this.videoBubbleOffset = new Vector3()
  },

  methods: {
    showVideoBubble() {
      this.videoBubble.object.show()
    },

    hideVideoBubble() {
      this.videoBubble.object.hide()
    },

    getVideoBubbleOffset() {
      const offset = this.goals.videoBubbleOffset
      this.videoBubbleOffset.x = offset.get('x')
      this.videoBubbleOffset.y = offset.get('y')
      this.videoBubbleOffset.z = offset.get('z')
      return this.videoBubbleOffset
    },

    update(delta) {
      this.videoBubble.position.copy(this.object.position)
      this.videoBubble.position.add(this.getVideoBubbleOffset())

      const screenSize = { width: this.stage.width, height: this.stage.height }
      this.videoBubble.object.project(
        this.videoBubble.position,
        this.stage.camera,
        screenSize
      )
    },
  },
})

export { HasVideoBubble }
