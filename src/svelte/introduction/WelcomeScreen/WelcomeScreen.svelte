<script>
  import ContinueButton from '../../ContinueButton'
  import Checkbox from '../../Checkbox'
  import DefaultScreen from '../DefaultScreen'

  import TermsOfService from '../TermsOfService.svelte'

  import { name, agreeTos } from '../../SettingsStore.js'

  let showTOS = false
  let agree = false

  function handleAgree(value) {
    agree = value
  }

  function handleContinue() {
    $agreeTos = agree
  }
</script>

<DefaultScreen>
  {#if $name && $name.length > 2}
    <h1>Welcome to Relm, {$name}!</h1>
  {:else}
    <h1>Welcome to Relm!</h1>
  {/if}

  <div class="relm-image" />

  <div class="para">
    Relm is a virtual world with video conferencing.
    <ul>
      <li>Join a virtual neighborhood</li>
      <li>Collaborate with coworkers</li>
      <li>Go to school with your classmates</li>
      <li>Play games</li>
    </ul>
  </div>

  <div class="para">
    During your stay, you will likely encounter some awesome people, but as in
    real life, there's always a chance some people won't behave in a civil way.
  </div>

  <div class="para squeezed">
    <Checkbox checked={agree} onCheck={handleAgree}>
      I'm at least 13 years old, and I agree to Relm's
      <a
        href="#"
        class="tos-button"
        on:click|preventDefault={() => (showTOS = !showTOS)}>Terms of Service</a>
    </Checkbox>
  </div>

  <ContinueButton on:click={handleContinue} enabled={agree} />

  {#if showTOS}
    <div class="terms-of-service">
      <TermsOfService />
    </div>
  {/if}
</DefaultScreen>

<style>
  .relm-image {
    width: 500px;
    height: 300px;

    background-image: url(./images/relm-screen.jpg);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;

    margin: 0 auto;
    border-radius: 16px;
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);
  }
  .para {
    margin: 16px 0px;
  }
  .terms-of-service {
    border: 2px solid #ddd;
    border-radius: 16px;
    margin: 16px 24px 16px 16px;
    padding: 8px 16px;
  }
  .squeezed {
    max-width: 400px;
    margin: 0 auto;
  }
</style>
