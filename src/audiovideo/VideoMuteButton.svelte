<script>
  export let muted = false
  export let onToggle = (_muted) => {}

  function handleClick() {
    onToggle(!muted)
  }
</script>

<div class="button" class:muted on:mousedown|preventDefault={handleClick}>
  <!-- {#if muted}
    <img src="/audio-disabled.svg" width="32" alt="Audio Disabled" />
  {:else}<img src="/audio-enabled.svg" width="32" alt="Audio Enabled" />{/if} -->
</div>

<style>
  .button {
    position: absolute;
    left: 50%;
    bottom: -0.75em;
    width: 1.5em;
    height: 1.5em;
    transform: translate(-50%, 0);

    background: white center no-repeat url(./icons/unmuted.png);
    background-size: 1.1em 1.1em;

    border: 3px solid white;
    border-radius: 18px;

    z-index: 1;

    pointer-events: auto;
  }
  .button:hover {
    border-color: #eebb11;
  }
  .button:hover::before {
    position: relative;
    left: 2em;
    height: 20px;

    font-family: Verdana, Geneva, Tahoma, sans-serif;
    content: 'Mute (M)';

    padding: 3px 8px 3px 8px;

    border-radius: 5px;

    background-color: white;
    white-space: nowrap;
  }
  .button.muted {
    background-image: url(./icons/muted.png);
  }
</style>
