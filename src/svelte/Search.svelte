<script>
  import { listPublicRelms } from '../api/search.js'
  let promise = listPublicRelms()
</script>

<h1>Relms</h1>

{#await promise}
  Loading...
{:then relms}
  <div class="results">
    {#each relms as relm}
      <div class="result">
        <a href="/{relm.relmName}">{relm.relmName}</a>
      </div>
    {/each}
  </div>
{:catch err}
  {console.error(err)} There was a problem loading the results.
{/await}

<style>
  h1 {
    text-align: center;
    font-family: 'Inter var', -apple-system, BlinkMacSystemFont,
      'Helvetica Neue', Helvetica, sans-serif;
    color: white;
    font-size: 6.4rem;
    font-weight: 800;
    line-height: 1.138888889;
  }
  .results {
    display: flex;
    flex-direction: column;
    padding: 0 25%;
  }
  .result {
    color: white;
    font-family: 'Inter var', -apple-system, BlinkMacSystemFont,
      'Helvetica Neue', Helvetica, sans-serif;
    font-size: 3rem;
    line-height: 1.138888889;
  }
  .result a {
    text-decoration: none;
    color: white;
  }
  .result a:visited {
    color: white;
  }
  .result:hover {
    animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(5px, 0, 0);
    }
  }
</style>
