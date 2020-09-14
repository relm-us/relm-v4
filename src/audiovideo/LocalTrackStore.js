import { writable } from 'svelte/store'

const videoTrack = writable(null)

const audioTrack = writable(null)

export { videoTrack, audioTrack }
