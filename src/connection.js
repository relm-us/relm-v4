import { createConnectionStore, defaultConfigStore } from 'jitsi-svelte'

const connection = createConnectionStore(defaultConfigStore)

// Cache the single Jitsi conference room.
//TODO: allow access to multiple rooms simultaneously
let conference
let participants = {}
let participantsUnsubscribe
connection.conferencesStore.subscribe(($conferences) => {
  const list = Object.values($conferences)
  if (list.length > 0) {
    conference = list[0]
    participantsUnsubscribe = conference.participants.subscribe(
      ($participants) => {
        participants = { ...$participants }
      }
    )
  } else {
    if (participantsUnsubscribe) {
      participantsUnsubscribe()
      participantsUnsubscribe = null
    }
    conference = null
  }
})

export { connection, conference, participants }
