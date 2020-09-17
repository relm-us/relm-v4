import { writable } from 'svelte/store'

// string
const myParticipantId = writable(null)

// [key: string]: {x: float, y: float}
const videoPositions = writable({})

export { myParticipantId, videoPositions }
