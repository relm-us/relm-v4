<script>
  export let audioEnabled = true
  export let volume = 0
  export let setAudioEnabled = (_) => {}

  let popup = false

  function handleClick() {
    setAudioEnabled(!audioEnabled)
  }
</script>

<div
  class="button"
  class:muted={!audioEnabled}
  on:mousedown|preventDefault={handleClick}
  on:mouseover={() => (popup = true)}
  on:mouseout={() => (popup = false)}
  style="--percent: {volume}%" />
{#if popup}
  <div class="popup">Mute (M)</div>
{/if}

<style>
  .button {
    position: absolute;
    left: 50%;
    bottom: -0.75em;
    width: 1.5em;
    height: 1.5em;
    transform: translate(-50%, 0);

    background-image: url(./images/mic-unmuted-inv.png),
      linear-gradient(
        0deg,
        rgba(70, 180, 74, 1) var(--percent),
        rgba(66, 66, 66, 1) var(--percent)
      );
    background-size: 110%, 110%;
    background-position: center, center;

    border: 3px solid white;
    border-radius: 100%;

    z-index: 3;
    overflow: hidden;

    pointer-events: auto;
  }
  .button.muted {
    background-color: #f22;
    background-image: url(./images/mic-muted-inv.png);
  }
  .button:hover {
    border-color: #eebb11;
  }
  .popup {
    position: absolute;
    left: 50%;
    bottom: -0.75em;
    transform: translate(1.5em, 0);

    font-family: Verdana, Geneva, Tahoma, sans-serif;

    padding: 3px 8px 3px 8px;

    border-radius: 5px;

    background-color: white;
    white-space: nowrap;
    z-index: 1;
  }
</style>
