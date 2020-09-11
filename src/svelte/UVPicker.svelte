<script>
  import { onMount } from 'svelte'
  import { UV_MAX_RANGE } from '../uvMapUtils.js'

  export let x = 0
  export let y = 0
  export let size = 100
  // export let range = [0, size]
  export let onPick

  function pixelToValue(pixel) {
    return ((pixel - size / 2) / size) * UV_MAX_RANGE
  }

  function valueToPixel(value) {
    return (value * size) / UV_MAX_RANGE + size / 2
  }

  let pressed = false

  let chosen = { x: valueToPixel(x), y: valueToPixel(y) }

  function pickAtCurrentPosition() {
    // const u = ((chosen.x - size / 2) / size) * UV_MAX_RANGE
    // const v = ((chosen.y - size / 2) / size) * UV_MAX_RANGE
    const u = pixelToValue(chosen.x)
    const v = pixelToValue(chosen.y)

    onPick(u, v)
  }

  function pickAtEvent(event) {
    chosen.x = event.offsetX
    chosen.y = event.offsetY

    pickAtCurrentPosition()
  }

  function mousemove(event) {
    if (pressed) {
      pickAtEvent(event)
    }
  }

  function mousedown(event) {
    if (event.target) pressed = true

    pickAtEvent(event)
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
  <div class="point" style="--x:{chosen.x}px; --y:{chosen.y}px" />
</div>

<style>
  .uv-picker {
    position: relative;
    width: var(--size);
    height: var(--size);
    border: 1px solid #ccc;
    background: #aaa;

    cursor: pointer;
  }

  .uv-picker:before,
  .uv-picker:after {
    content: '';

    position: absolute;
    left: 50%;
    top: 50%;
    background-color: black;

    pointer-events: none;
  }
  .uv-picker:before {
    transform: translate(-6.5px, -1.5px);

    width: 12px;
    height: 2px;
  }
  .uv-picker:after {
    transform: translate(-1.5px, -6.5px);

    width: 2px;
    height: 12px;
  }

  .point {
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
</style>
