import { ResourceLoader } from './resource_loader.js'
import { Stage } from './new_stage.js'
import { EntityUnconfigured } from './entity_unconfigured.js'
import { ShowLoadingProgress } from './show_loading_progress.js'
import { Network } from './new_network.js'

// Show progress as we load resources
const resources = window.resources = ResourceLoader()
resources.on('loaded', ({ id, currentProgress, maxProgress }) => {
  ShowLoadingProgress(id, currentProgress, maxProgress) 
})

// The Stage is where all the THREE.js things come together, e.g. camera, lights
const stage = window.stage = Stage({ width: window.innerWidth, height: window.innerHeight })

const network = window.network = Network()

// Create a new Entity stamp with configuration bound to it
const Entity = EntityUnconfigured.conf({ stage, resources, network })

export { Entity }