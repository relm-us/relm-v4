import { Entity } from './entity.js'
import { Label } from './label.js'
import { Decoration } from './decoration.js'

class ChatMessage {
  constructor (chatpost, name, text) {
    this.chatpost = chatpost
    this.name = name
    this.text = text
    this.position = new THREE.Vector3()
    this.position.copy(chatpost.root.position)

    this.createLabel ()
  }

  moveToHeight (height) {
    this.position.y = this.chatpost.root.position.y + height
  }

  createLabel () {
    this.label = new Label(this.chatpost.root, this.chatpost.stage.camera)
    this.label.createDomElement()
    this.label.domElement.classList.add('chat-message')
    this.label.domElement.style.width = "200px"
    this.label.domElement.addEventListener('click', (event) => {
      this.chatpost.destroy()
      this.label.domElement.remove()
    })
    // this.label.domElement.style.height = "30px"
    stage.renderTasks.push(() => {
      let labelText
      if (this.name) {
        labelText = this.name + ': ' + this.text
      } else {
        labelText = this.text
      }
      this.label.project(labelText, window.innerWidth, window.innerHeight, 0, 0, this.position)
    })
  }
}

class Chatpost extends Entity {
  constructor(position, stage, rsrc, opts) {
    super(opts)
    this.root.position.copy(position)
    this.messages = []
    this.stage = stage
    this.rsrc = rsrc
  }

  clearMessages () {
    for (let msg of this.messages) {
      msg.label.destroyDomElement()
    }
    this.messages = []
  }

  addMessage(name, text) {
    const lengthBefore = this.messages.length
    this.messages.unshift(new ChatMessage(this, this.messages.length > 0 ? name : '', text))
    if (this.messages.length === 1) {
      this.removeSignage()
      this.createSignPost()
    } else if (lengthBefore === 1 && this.messages.length === 2) {
      this.removeSignage()
      this.createSignPole()
    } else if (this.messages.length === 0) {
      this.removeSignage()
    }

    let y = 100
    for (let msg of this.messages) {
      msg.moveToHeight(y)
      const classList = msg.label.domElement.classList
      if (this.messages.length == 1) {
        if (!classList.contains('sign-message')) {
          classList.add('sign-message')
        }
        if (classList.contains('chat-message')) {
          classList.remove('chat-message')
        }
      } else if (this.messages.length > 1) {
        if (!classList.contains('chat-message')) {
          classList.add('chat-message')
        }
        if (classList.contains('sign-message')) {
          classList.remove('sign-message')
        }
      }
      y += 100
    }
  }

  removeSignage() {
    for (let child of this.root.children) {
      this.root.remove(child)
    }
  }

  destroy() {
    if (this.opts.onDestroy) {
      this.opts.onDestroy(this)
    }
    this.removeSignage()
    this.clearMessages()
  }

  createSignPost() {
    const signpost = new Decoration(this.rsrc.get('signpost'), { bottom: 120 })
    const mesh = signpost.cloneAt(0, 0, 0.5, this.stage.ground)
    mesh.material.alphaTest = 0.0
    mesh.material.transparent = true
    mesh.material.opacity = 0.5
    this.root.add(mesh)
  }

  createSignPole() {
    const signpost = new Decoration(this.rsrc.get('signpole'), { bottom: 120 })
    const mesh = signpost.cloneAt(0, 0, 0.5, this.stage.ground)
    mesh.material.alphaTest = 0.0
    mesh.material.transparent = true
    mesh.material.opacity = 0.5
    this.root.add(mesh)
  }

  highlight(yes) {
    let mesh
    this.root.traverse(o => {
      if (o.isMesh) {
        mesh = o
        mesh.material.opacity = yes ? 1.0 : 0.5
        return
      }
    })
    return mesh
  }
}

export { Chatpost, ChatMessage }
