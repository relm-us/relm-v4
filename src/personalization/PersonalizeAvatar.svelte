<script>
  import { onMount } from 'svelte'

  import { avatarOptionsOfGender } from '../avatars.js'
  import { swatches, skintoneMap } from './skintoneMap.js'

  import GenderButton from './GenderButton.svelte'

  export let player
  export let onClose

  const VARIANTS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  let selectedTab = 'f'
  let gender
  let variant

  let skintoneName = null

  function handleSelect(gender, index) {
    const avatarOptions = avatarOptionsOfGender(gender)

    player.goals.animationMesh.update({
      v: avatarOptions[index].avatarId,
    })

    const skintone = skintoneName
      ? skintoneMap[gender][index][skintoneName]
      : { x: 0, y: 0 }
    player.goals.skintone.update(skintone)
    player.goals.clothtone.update({ x: 0, y: 0 })

    onClose()
  }

  function selectSkintoneByName(name) {
    return (_event) => {
      skintoneName = name
    }
  }

  function selectGender(gender_) {
    return (event) => {
      selectedTab = gender_
    }
  }

  onMount(() => {
    ;[gender, variant] = player.getAvatar()
    if (gender) {
      selectedTab = gender
    }
  })
</script>

<h2>Select Your Avatar</h2>

<div class="swatch-row">
  <div class="label">Skin tone:</div>
  {#each swatches as [name, color]}
    <div
      class="swatch"
      class:selected={skintoneName === name}
      style="--color:{color}"
      on:mousedown|preventDefault={selectSkintoneByName(name)} />
  {/each}
</div>
<div class="tabs">
  <div
    class="tab"
    class:selected={selectedTab === 'f'}
    on:click={selectGender('f')}>
    Female
  </div>
  <div
    class="tab"
    class:selected={selectedTab === 'm'}
    on:click={selectGender('m')}>
    Male
  </div>
</div>
<div class="tab-panel">
  <div class="avatars-row">
    {#if selectedTab === 'f'}
      {#each VARIANTS as v}
        <GenderButton
          variant={v}
          gender="f"
          highlight={gender === 'f' && v === variant}
          onSelect={handleSelect} />
      {/each}
    {:else if selectedTab === 'm'}
      {#each VARIANTS as v}
        <GenderButton
          variant={v}
          gender="m"
          highlight={gender === 'm' && v === variant}
          onSelect={handleSelect} />
      {/each}
    {/if}
  </div>
</div>

<style>
  h2 {
    text-align: center;
    margin: 16px auto 4px auto;
  }
  .tabs {
    display: flex;
    flex-direction: row;
    margin-top: 16px;
  }
  .tab {
    text-align: center;
    flex-grow: 1;
    width: 50%;
    background-color: #ddd;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom: 1px solid #aaa;
    padding: 4px 8px;
    cursor: pointer;
  }
  .tab.selected {
    background-color: #f5f5f5;
    border-top: 1px solid #aaa;
    border-left: 1px solid #aaa;
    border-right: 1px solid #aaa;
    border-bottom: 0px;
  }
  .tab-panel {
    background-color: #f5f5f5;
    padding: 8px 15px;
    border-left: 1px solid #aaa;
    border-bottom: 1px solid #aaa;
    border-right: 1px solid #aaa;
  }
  .avatars-row {
    width: 240px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .swatch-row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 240px;
  }
  .swatch {
    border: 2px solid #eee;
    border-radius: 5px;
    background-color: var(--color);
    width: 32px;
    height: 32px;
    padding: 3px;
  }
  .swatch:hover {
    border-color: #ccc;
  }
  .swatch.selected {
    border-color: red;
  }
</style>
