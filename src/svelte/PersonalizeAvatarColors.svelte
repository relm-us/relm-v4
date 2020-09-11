<script>
  import { onMount } from 'svelte'
  import { hasAncestor } from './util.js'
  import UVPicker from './UVPicker.svelte'

  export let color = { x: 0, y: 0 }
  export let skintone = { x: 0, y: 0 }
  export let onClose
  export let onPickColor
  export let onPickSkintone

  let panel

  function windowMousedown(event) {
    if (!hasAncestor(event.target, panel)) {
      onClose()
    }
  }

  onMount(() => {
    window.addEventListener('mousedown', windowMousedown)
    return () => {
      window.removeEventListener('mousedown', windowMousedown)
    }
  })
</script>

<div class="panel" bind:this={panel}>
  <div class="row">
    <div class="box">
      <div class="label">Style:</div>
      <UVPicker onPick={onPickColor} x={color.x} y={color.y} />
    </div>
    <div class="box">
      <div class="label">Skintone:</div>
      <UVPicker onPick={onPickSkintone} x={skintone.x} y={skintone.y} />
    </div>
  </div>
</div>

<style>
  .panel {
    position: fixed;
    bottom: 48px;
    width: 50%;
    transform: translate(-50%);
    min-width: 360px;
    height: 160px;

    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background-color: white;

    padding: 8px 16px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .row {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .box {
    margin: 0 8px;
  }
</style>
