<script>
  import VideoCircle from '../VideoCircle'

  export let conference
  export let positions

  const participants = conference.participants
</script>

{#each Object.entries($participants) as [participantId, participant]}
  {#if positions[participantId]}
    <VideoCircle {participant} position={positions[participantId]} />
  {:else}no video{/if}
{/each}
