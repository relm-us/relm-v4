<script>
  import { connection } from '../../connection.js'

  import Conference from './Conference'

  export let positions

  const conferences = connection.conferencesStore
</script>

<div class="video-overlay">
  {#each Object.entries($conferences) as [conferenceId, conference]}
    <Conference {conference} {positions} />
  {/each}
</div>
