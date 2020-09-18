import { writable } from 'svelte/store'

// string
const myParticipantId = writable(null)

// [key: string]: {x: float, y: float}
const videoPositions = writable({})

// float
const videoSize = writable(100)

// [key: string]: boolean
const videoVisibilities = writable({})

export { myParticipantId, videoPositions, videoVisibilities, videoSize }
