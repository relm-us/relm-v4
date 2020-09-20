import { writable } from 'svelte/store'

// [key: string]: string
// Maps from conferenceId to myParticipantId within that conference
const myParticipantIds = writable({})

// [key: string]: {x: float, y: float}
const videoPositions = writable({})

// float
const videoSize = writable(100)

// [key: string]: boolean
const videoVisibilities = writable({})

export { myParticipantIds, videoPositions, videoVisibilities, videoSize }
