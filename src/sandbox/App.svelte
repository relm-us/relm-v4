<script context="module">
  const myvar = new Set()
</script>

<div>{Array.from(myvar)}</div>

<button on:click={() => { myvar.add(Math.floor(Math.random()*100)) }}>Click</button>