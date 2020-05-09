import stampit from 'stampit'
import Collision from '@stamp/collision'

const UpdateCollision = Collision.collisionSetup({
  defer: ['updateDomElement']
})

const CanProject = stampit(UpdateCollision, {
  props: {
    domElement: null
  },
  
  init() {
    this.vector = new THREE.Vector3()
    this.domElement = null
  },

  methods: {
    project(position, camera, screen) {
      this.vector.copy(position)

      this.vector.project( camera ); 
      this.vector.x = (this.vector.x + 1) * screen.width / 2
      this.vector.y = -(this.vector.y - 1) * screen.height / 2
      this.vector.z = 0

      this.updateDomElement()
    },

    updateDomElement() {
      if (this.domElement) {
        this.domElement.style.left = this.vector.x + 'px'
        this.domElement.style.top = this.vector.y + 'px'
      }
    }
  }
})

const WithLabel = stampit(UpdateCollision, {
  init({ body = document.body }) {
    this.domElement = document.createElement('div')
    this.domElement.classList.add('entity-label')
    this.documentBody = body
  },

  methods: {
    show() {
      if (!this.domElement) { return }
      this.domElement.style.display = ""
    },

    hide() {
      if (!this.domElement) { return }
      this.domElement.style.display = "none"
    },

    setText(text) {
      this.text = text
      this.domElement.textContent = text
    },

    updateDomElement() {
      if (!this.domElement.parentNode) {
        this.documentBody.appendChild(this.domElement)
      }
    },

    destroyDomElement() {
      if (this.domElement) {
        this.domElement.remove()
      }
    }
  }
})

const Label = stampit(
  CanProject,
  WithLabel
)

export { Label, WithLabel, CanProject, UpdateCollision }