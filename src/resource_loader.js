import stampit from 'stampit'
import EventEmittable from '@stamp/eventemittable'
import queue from 'queue'

import { manifest } from './manifest.js'

const NUMBER_OF_THINGS_TO_LOAD_AT_A_TIME = 4

const ResourceLoader = (window.ResourceLoader = stampit(EventEmittable, {
  name: 'ResourceLoader',

  props: {
    resources: {},
  },

  init() {
    this.currentProgress = 0
    this.maxProgress = 0
    this.resources = {}
    this.added = {}
    this.q = queue({
      concurrency: NUMBER_OF_THINGS_TO_LOAD_AT_A_TIME,
    })
  },

  methods: {
    // Registers a resource but doesn't queue it up to be loaded
    add(id, loader, path) {
      if (!this.added[id]) {
        const sizeInBytes = manifest[path]
        this.maxProgress += sizeInBytes || 0
        this.added[id] = { loader, path, sizeInBytes }
        // console.log('resource added', id, this.added[id])
      }
    },

    // Queues up a resource to be loaded during the next load() call
    enqueue(ids) {
      for (let id of ids) {
        const { loader, path, sizeInBytes } = this.added[id]
        this.q.push((cb) => {
          loader.load(path, (loadedResource) => {
            this.currentProgress += sizeInBytes || 0
            this.resources[id] = loadedResource
            this.emit('loaded', {
              id,
              path,
              sizeInBytes,
              resource: loadedResource,
              currentProgress: this.currentProgress,
              maxProgress: this.maxProgress,
            })
            cb()
          })
        })
      }
    },

    load(fn) {
      return new Promise((resolve, reject) => {
        this.q.start(resolve)
      })
    },

    get(id) {
      if (!(id in this.resources)) {
        console.trace(
          'Unable to get resource',
          id,
          '(key not present in this.resources)'
        )
      }
      return this.resources[id]
    },

    getAsync(id) {
      return new Promise((resolve, reject) => {
        if (!(id in this.resources)) {
          const { loader, path } = this.added[id]
          loader.load(
            path,
            (loadedResource) => {
              this.resources[id] = loadedResource
              resolve(this.resources[id])
            },
            null,
            reject
          )
        } else {
          resolve(this.resources[id])
        }
      })
    },

    getObject(id, objectName) {
      let resource = this.get(id).scene
      let object
      resource.traverse((o) => {
        if (o.name === objectName) {
          object = o
          return
        }
      })
      return object
    },
  },
}))

export { ResourceLoader }
