<script>
  import { get } from 'http'
  import Audio from '../audiovideo/Audio.svelte'
  import App from './App.svelte'
  import PersonalizeAvatar from './PersonalizeAvatar.svelte'
  import PersonalizeAvatarColors from './PersonalizeAvatarColors.svelte'

  export let stage
  export let onClose
  export let setTransparent

  const Screens = {
    SELECT_AVATAR: 0,
    CUSTOM_COLORS: 1,
  }

  let screen = Screens.SELECT_AVATAR

  function onPickClothtone(x, y) {
    stage.player.goals.clothtone.update({ x, y })
  }

  function onPickSkintone(x, y) {
    stage.player.goals.skintone.update({ x, y })
  }
</script>

<div class="personalize">
  {#if screen === Screens.SELECT_AVATAR}
    <PersonalizeAvatar player={stage.player} {onClose} />
    <div class="button-panel">
      <button
        on:mousedown|preventDefault
        on:mouseup|preventDefault={() => {
          screen = Screens.CUSTOM_COLORS
          setTransparent(true)
        }}>
        Custom Colors
      </button>
      <button on:mousedown|preventDefault on:mouseup|preventDefault={onClose}>
        Close
      </button>
    </div>
  {:else if screen === Screens.CUSTOM_COLORS}
    <PersonalizeAvatarColors
      clothtone={{ x: stage.player.goals.clothtone.get('x'), y: stage.player.goals.clothtone.get('y') }}
      skintone={{ x: stage.player.goals.skintone.get('x'), y: stage.player.goals.skintone.get('y') }}
      {onClose}
      {onPickClothtone}
      {onPickSkintone} />
  {/if}
</div>

<style>
  .personalize {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow-y: auto;
    z-index: 4;
    margin-left: 100px;
    margin-right: 100px;
    margin-bottom: 8px;
    background-color: #fff;
  }
  .button-panel {
    margin-top: 10px;
    padding-bottom: 20px;
    display: flex;
    justify-content: flex-end;
  }
  .button-panel button {
    margin-left: 10px;
    margin-top: 15px;
  }
</style>
