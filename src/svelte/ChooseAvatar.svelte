<script>
  import { chooseAvatarState } from './stores.js'
  import { avatarOptionsOfGender } from '../avatars.js'
  
  export let stage
  
  let visible
  
  chooseAvatarState.subscribe(value => {
    visible = value
  })
  
  function handleClose() {
    chooseAvatarState.update(() => false)
    stage.focusOnGame()
  }
  
  function handleSelect(gender, index) {
    const avatarOptions = avatarOptionsOfGender(gender)
    stage.player.goals.animationMesh.update({ v: avatarOptions[index].avatarId })
    
    handleClose()
  }
  
  const genders = ['f', 'm']
  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8]
</script>


<style>
.avatars {
  position: absolute;
  padding-top: 80px;
  padding-bottom: 80px;
  top: 0px;
  bottom: 0px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-y: auto;
  z-index: 4;
}
.avatars .title {
  font-size: 22px;
  font-weight: bold;
  padding: 20px;
}
.avatars .avatars-row {
  min-width: 380px; max-width: 700px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}
.avatars button {
  padding: 8px;
}
.avatars button.f img {
  border-bottom: 3px solid pink;
}
.avatars button.m img {
  border-bottom: 3px solid #66bbff;
}
.avatars img {
  width: 75px;
  height: 172px;
  pointer-events: none;
}
.avatars > .button-panel {
  margin-top: 10px;
  padding-bottom: 100px;
  display: flex;
  justify-content: flex-end;
}
.avatars .button {
  margin-left: 10px;
  margin-top: 15px;
}
</style>


<div class="avatars" class:hide={ !visible }>
  <div class="title">Choose your character:</div>
  
  <div class="avatars-row">
    {#each genders as g}
      {#each options as opt}
        <button
          class="avatar-button {g}"
          on:click={e => handleSelect(g, opt)}
          on:mousedown|preventDefault
          data-gender={g}
          data-index={opt}
        >
          <img src="avatars/{g}{opt}.jpg" alt="gender {g} option {opt}">
        </button>
      {/each}
    {/each}
  </div>
  
  <div class="button-panel">
    <button
      class="button"
      on:mousedown|preventDefault
      on:mouseup|preventDefault={handleClose}
    >
      Close
    </button>
  </div>
  
</div>