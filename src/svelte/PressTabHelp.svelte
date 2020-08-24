<script>
  import State from './stores.js'

  let visible

  State.pressTabHelpVisible.subscribe((value) => (visible = value))
</script>

<style>
  .press-tab-help {
    position: absolute;
    bottom: 80px;
    left: 50px;
    font-size: 28px;
    font-weight: bold;
    color: #efaa22;
    border: 5px solid #efef22;
    border-radius: 8px;
    background-color: gray;
    padding: 10px 25px;
    display: none;
  }
  .press-tab-help.show {
    display: block;
    animation: fadein 0.5s, bounce 0.5s infinite alternate;
    /* animation-delay: 0.0s, 0.5s; */
  }
  .press-tab-help.hide {
    display: block;
    animation: fadeout 0.5s;
    animation-fill-mode: forwards;
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes fadeout {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes bounce {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(-15px);
    }
  }

  i {
    border: solid black;
    border-width: 0 3px 3px 0;
    display: inline-block;
    padding: 3px;
  }
  .right {
    transform: rotate(-45deg) scale(2);
  }
  .left {
    transform: rotate(135deg) scale(2);
  }
  .up {
    transform: rotate(-135deg) scale(2);
  }
  .down {
    transform: rotate(45deg) scale(2);
  }
</style>

<div
  on:mousedown|preventDefault
  class="press-tab-help"
  class:show={visible}
  class:hide={!visible}>
  <i
    class="down"
    style="border-color:#efef22; position: absolute; bottom: -10px;" />
  Press Enter to Type
</div>
