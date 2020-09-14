<script>
  import { swatches } from './skintoneMap.js'

  import GenderButton from './GenderButton.svelte'

  export let gender = null // 'm' | 'f'
  export let variant = null // 0 - 8
  export let skintoneId = null // 'pink' | 'black' | 'white' | 'asian' | 'tan'
  export let onChange = (gender, variant, skintoneId) => {}
  export let onClose = () => {}

  const VARIANTS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  let selectedGenderTab = gender || 'f'

  let transientSkintoneId = 'pink'

  function handleSelect(gender, variant) {
    console.log('handleSelect', gender, variant, transientSkintoneId)
    // import { avatarOptionsOfGender } from '../avatars.js'
    // const avatarId = avatarOptionsOfGender(gender)[variant].avatarId
    onChange(gender, variant, transientSkintoneId)

    // player.goals.animationMesh.update({
    //   v: avatarOptions[variant].avatarId,
    // })

    // const skintone = skintoneName
    //   ? skintoneMap[gender][index][skintoneName]
    //   : { x: 0, y: 0 }
    // player.goals.skintone.update(skintone)
    // player.goals.clothtone.update({ x: 0, y: 0 })

    onClose()
  }
</script>

<h2>Select Your Avatar</h2>

<div class="swatch-row">
  <div class="label">Skin tone:</div>
  {#each swatches as [swatchId, color]}
    <div
      class="swatch"
      class:selected={(transientSkintoneId || skintoneId) === swatchId}
      style="--color:{color}"
      on:mousedown|preventDefault={(_) => (transientSkintoneId = swatchId)} />
  {/each}
</div>
<div class="tabs">
  {#each [['f', 'Female'], ['m', 'Male']] as [genderTab, label]}
    <div
      class="tab"
      class:selected={selectedGenderTab === genderTab}
      on:click={(_) => (selectedGenderTab = genderTab)}>
      {label}
    </div>
  {/each}
</div>
<div class="tab-panel">
  <div class="avatars-row">
    {#each VARIANTS as v}
      <GenderButton
        variant={v}
        gender={selectedGenderTab}
        highlight={gender === selectedGenderTab && v === variant}
        onSelect={handleSelect} />
    {/each}
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
    display: flex;
    justify-content: center;

    background-color: #f5f5f5;
    padding: 8px 15px;
    border-left: 1px solid #aaa;
    border-bottom: 1px solid #aaa;
    border-right: 1px solid #aaa;
  }
  .avatars-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-evenly;

    width: 240px;
  }

  .swatch-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 24px;
  }
  .swatch-row .label {
    margin-right: 16px;
  }
  .swatch {
    border: 2px solid #eee;
    border-radius: 5px;
    background-color: var(--color);
    width: 32px;
    height: 32px;
    padding: 3px;
    cursor: pointer;
  }
  .swatch:hover {
    border-color: #ccc;
  }
  .swatch.selected {
    border-color: red;
  }
</style>
