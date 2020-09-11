<script>
  import { onMount } from 'svelte'
  import { UV_MAX_RANGE } from '../uvMapUtils.js'

  export let size = 100
  export let onPick

  let pressed = false

  let chosen = { x: size / 2, y: size / 2 }
  let hover = { x: size / 2, y: size / 2 }

  function pickAtCurrentPosition() {
    const u = ((chosen.x - size / 2) / size) * UV_MAX_RANGE
    const v = ((chosen.y - size / 2) / size) * UV_MAX_RANGE

    onPick(u, v)
  }

  function mousemove(event) {
    hover.x = event.offsetX
    hover.y = event.offsetY

    if (pressed) {
      chosen.x = event.offsetX
      chosen.y = event.offsetY

      pickAtCurrentPosition()
    }
  }

  function mousedown() {
    pressed = true
  }

  function mouseup() {
    pressed = false
  }

  onMount(() => {
    window.addEventListener('mouseup', mouseup)
    return () => {
      window.removeEventListener('mouseup', mouseup)
    }
  })
</script>

<div
  class="uv-picker"
  style="--size:{size}px"
  on:mousemove={mousemove}
  on:mousedown={mousedown}>
  <div class="cross-hairs white" style="--x:{hover.x}px; --y:{hover.y}px" />
  <div class="cross-hairs" style="--x:{chosen.x}px; --y:{chosen.y}px" />
</div>

<style>
  .uv-picker {
    position: relative;
    width: var(--size);
    height: var(--size);
    border: 1px solid #ccc;
    background: #aaa;
  }

  .cross-hairs {
    position: absolute;
    left: var(--x);
    top: var(--y);
    border-radius: 5px;
    pointer-events: none;

    background-color: black;
    width: 5px;
    height: 5px;

    transform: translate(-3px, -3px);
  }
  .cross-hairs.white {
    opacity: 0.8;
    background-color: white;
    width: 9px;
    height: 9px;
    transform: translate(-5px, -5px);
  }
</style>
