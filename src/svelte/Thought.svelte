<script>
  export let text = null
</script>

<div class="thought">
  <input placeholder="What's on your mind? ..." value={text} disabled />
</div>

<style>
  .thought {
    opacity: 0.8;
    margin: 10px 0;
    padding: 4px 10px;
    background-color: #555;
    display: flex;
  }
  .thought > input {
    font-size: 24px;
    border: 2px solid #111;
    color: white;
    background-color: #555;
    padding: 4px 10px;
    flex-grow: 1;
  }
  .thought > input::placeholder {
    color: white;
  }
</style>
