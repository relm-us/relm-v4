<script>
  import TermsOfService from './TermsOfService.svelte'
  import Checkmark from './Checkmark'

  let tos = false
  let agree = false

  function handleAgree(value) {
    agree = value
  }
</script>

<h1>Welcome to Relm!</h1>

<div class="para">
  Relm is a virtual world with video conferencing where you can join a
  neighborhood, go to school with your classmates, collaborate with coworkers,
  and play games.
</div>

<div class="para">
  During your stay, you will likely encounter some awesome people, but as in
  real life, there's always a chance some people won't behave in a civil way.
</div>

<div class="para">
  <Checkmark checked={agree} onCheck={handleAgree} />
  I'm 13 years or older and I agree to Relm's <button on:click={() => (tos = true)}>Terms
    of Service</button>
</div>

{#if tos}
  <div class="terms-of-service">
    <TermsOfService />
  </div>
{/if}

<button>Continue</button>

<style>
  .para {
    margin: 8px 16px;
  }
</style>
