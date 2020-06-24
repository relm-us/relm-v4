
<script>
  import {
    KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
    KEY_TAB, KEY_RETURN, KEY_ESCAPE,
  } from 'keycode-js'
  
  import { config } from '../config.js'
  import { runCommand } from '../commands.js'
  
  export let stage
  export let network

  let thought = null
  
  const cfg = config(window.location)

  // Allow TAB and ESC keys to switch from text input to game view
  const handleKeydown = (e) => {
    const text = e.target.value.trim()
    if (e.keyCode === KEY_TAB) {
      // Don't allow TAB to propagate up and cause focus to be switched us back to input
      e.preventDefault()
      e.stopPropagation()
      stage.focusOnGame()
    } else if (e.keyCode === KEY_ESCAPE) {
      stage.player.setThought(null)
      stage.focusOnGame()
    } else if (e.keyCode === KEY_RETURN) {
      if (text.substring(0,1) === '/') {
        thought = text.substring(1)
        runCommand(thought, { network, stage, cfg })
        e.target.value = ''
        stage.focusOnGame()
      } else if (text !== '') {
        thought = text
        // Before focusing back on the game, make a thought bubble, and clear the text
        stage.player.setThought(text)
        e.target.value = ''
      } else {
        stage.focusOnGame()
      }
    } else if (e.keyCode === KEY_UP) {
      e.target.value = thought
      setTimeout(() => {
        e.target.focus()
        e.target.setSelectionRange(thought.length, thought.length)
      }, 50)
    } else if (
      (e.keyCode === KEY_DOWN) ||
      ((e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT) && text === "")
    ) {
      // If the player has typed nothing, but uses the arrow keys, go back to the game
      stage.focusOnGame()
      stage.kbController.keyPressed(e.keyCode)
    }
  }
</script>

<style>
  .thought-bar {
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    opacity: 0.8;
    z-index: 99;
    padding: 4px 10px;
    background-color: #555;
    display: flex;
  }
  .thought-bar:focus-within {
    background-color: #eee;
  }
  .thought-bar:focus-within::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0px;
    left: 0;
    right: 0;
    box-shadow: inset 0px 0px 12px #fe9;
  }
  .thought-bar > input::placeholder {
    color: white;
  }
  .thought-bar:focus-within > input::placeholder, .thought-bar:focus-within > input {
    color: black;
    background-color: #eee;
  }
  .thought-bar > input {
    font-size: 24px;
    border: 2px solid #111;
    color: white;
    background-color: #555;
    padding: 4px 10px;
    flex-grow: 1;
  }
  /* easier to read font size on mobile */
  @media only screen and (max-width: 900px) {
    .thought-bar > input {font-size:24px !important;}
  }
</style>

<div class="thought-bar">
  <input
    id="input"
    type="text"
    placeholder="What's on your mind? ..."
    on:keydown={ handleKeydown }
  >
</div>