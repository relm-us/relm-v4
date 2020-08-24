<script>
  import { avatarOptionsOfGender } from '../avatars.js'

  export let stage
  export let handleClose

  function handleSelect(gender, index) {
    const avatarOptions = avatarOptionsOfGender(gender)
    stage.player.goals.animationMesh.update({
      v: avatarOptions[index].avatarId,
    })

    handleClose()
  }

  const genders = ['f', 'm']
  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8]
</script>

<style>
  .avatars {
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
    min-width: 380px;
    max-width: 660px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  .avatars {
    margin-bottom: 8px;
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
    width: 38px;
    height: 86px;
    pointer-events: none;
  }
  .avatars > .button-panel {
    margin-top: 10px;
    padding-bottom: 20px;
    display: flex;
    justify-content: flex-end;
  }
  .avatars .button {
    margin-left: 10px;
    margin-top: 15px;
  }
</style>

<div class="avatars">
  <h2>Select your avatar:</h2>

  <div class="avatars-row">
    {#each genders as g}
      {#each options as opt}
        <button
          class="avatar-button {g}"
          on:click={(e) => handleSelect(g, opt)}
          on:mousedown|preventDefault
          data-gender={g}
          data-index={opt}>
          <img src="avatars/{g}{opt}.jpg" alt="gender {g} option {opt}" />
        </button>
      {/each}
    {/each}
  </div>

  <div class="button-panel">
    <button
      class="button"
      on:mousedown|preventDefault
      on:mouseup|preventDefault={handleClose}>
      Close
    </button>
  </div>

</div>
