<script>
  import TermsOfService from '../TermsOfService.svelte'
  import Checkmark from '../Checkmark'

  export let next = () => {}

  let showTOS = false
  let agree = false

  function handleAgree(value) {
    agree = value
  }
</script>

<div class="background" />

<div class="single-column">
  <h1>Welcome to Relm!</h1>

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
    <Checkmark checked={agree} onCheck={handleAgree}>
      I'm at least 13 years old, and I agree to Relm's <a href="#" class="tos-button" on:click|preventDefault={() => (showTOS = !showTOS)}>Terms
        of Service</a>
    </Checkmark>
  </div>

  <button
    class="continue"
    class:disabled={!agree}
    on:click={next}>Continue</button>

  {#if showTOS}
    <div class="terms-of-service">
      <TermsOfService />
    </div>
  {/if}
</div>

<style>
  .background {
    position: fixed;
    height: 100%;
    width: 100%;
    background-color: #333;
    z-index: -1;
  }
  .single-column {
    margin: 0 auto;
    padding: 8px 24px;
    width: 600px;
    min-height: 100%;
    border-left: 2px solid #ddd;
    border-right: 2px solid #ddd;
    background-color: white;
  }
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
  .continue {
    display: block;
    margin: 32px auto;
    border: 0;
    background-color: #ffa833;
    color: #643;
    padding: 16px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }
  .continue.disabled {
    pointer-events: none;
    opacity: 0.3;
  }
  .continue:hover {
    background-color: #ffb840;
  }
</style>
