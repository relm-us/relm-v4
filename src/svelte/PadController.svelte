<script>
  export let stage

  const padController = stage.create('padcon', { target: stage.player })
  
  let controlPadEl

  let buttonDown = false

  function handleTouchMove(event) {
    const rect = controlPadEl.getBoundingClientRect()
    const touchX = event.targetTouches[0].clientX - rect.x
    const touchY = event.targetTouches[0].clientY - rect.y
    const x = (touchX - rect.width / 2) / (rect.width/2)
    const y = (touchY - rect.height / 2) / (rect.height/2)
    const position = new THREE.Vector3(x * 100, 0, y * 100)
    padController.padDirectionChanged(position)
  }
  
  function handleTouchEnd(event) {
    padController.padDirectionChanged(new THREE.Vector3())
  }
  
  function handleMouseMove(event) {
    const rect = controlPadEl.getBoundingClientRect()
    const x = (event.layerX - rect.width / 2) / (rect.width/2)
    const y = (event.layerY - rect.height / 2) / (rect.height/2)
    const position = new THREE.Vector3(x * 100, 0, y * 100)
    padController.padDirectionChanged(position)
  }
  
  function handleMouseEnd(event) {
    padController.padDirectionChanged(new THREE.Vector3())
  }


  function handleButtonDown(event) {
    buttonDown = true
  }
  
  function handleButtonUp(event) {
    buttonDown = false
  }
</script>

<style>
.front {
  z-index: 99;
}

.mobile { display: none; }

@media (any-pointer: coarse) {
  .mobile { display: block !important; }
}
@media (any-hover: none) {
  .mobile { display: block !important; }
}



.wrapper-left {
  position: absolute;
  left: 0.5em;
  bottom: 60px;
  
  width: 18em;
  height: 18em;
}

.wrapper-right {
  position: absolute;
  
  right: 0.5em;
  bottom: 60px;
  
  width: 10em;
  height: 10em;
}

.pad-button {
  fill: #ffffff;
}
.control-button {
  fill: black;
}
.pad-button.pressed, .control-button.pressed {
  fill: #ff0000 !important;
}

.pad-button, .pad-circle {
  pointer-events: none;
}

/* smaller controls on desktop touch screens */
@media only screen and (min-width: 900px) {
  .wrapper {font-size:12px !important;}
}
/* medium controls on mobile touch screens */
@media only screen and (max-width: 900px) {
  .wrapper {font-size:8px !important;}
}

.translucent {
  opacity: 0.3;
}
</style>

<div class="wrapper wrapper-left">
  <svg
    bind:this={ controlPadEl }
    class="mobile translucent front"
    draggable="false"
    
    on:touchstart={handleTouchMove}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchEnd}
    
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseEnd}
    on:mouseleave={handleMouseEnd}
    
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 135 135"
    version="1.1"
  >
    <g><circle class="pad-circle" cx="67.259" cy="67.259" r="63.009" style="stroke:#ebebeb;stroke-width:7.5px;"></circle>
      <path class="pad-button" d="M67.198,56.462c-5.192,-0.166 -11.916,-6.666 -13.555,-9.64c-1.767,-3.207 -1.894,-17.136 -1.979,-25.608c-0.063,-6.147 8.016,-6.735 8.033,-6.737l15.123,0c0,0 8.096,0.583 8.034,6.737c-0.086,8.472 -0.213,22.401 -1.98,25.608c-1.645,2.986 -8.415,9.525 -13.615,9.641l-0.061,-0.001Z"></path>
      <path class="pad-button" d="M78.056,67.198c0.166,-5.192 6.665,-11.916 9.64,-13.555c3.207,-1.767 17.136,-1.894 25.607,-1.979c6.148,-0.063 6.736,8.016 6.737,8.033l0,15.123c0,0 -0.583,8.096 -6.737,8.034c-8.471,-0.086 -22.4,-0.213 -25.607,-1.98c-2.986,-1.645 -9.525,-8.415 -9.642,-13.615l0.002,-0.061Z"></path>
      <path class="pad-button" d="M67.32,78.056c5.192,0.166 11.916,6.665 13.554,9.64c1.767,3.207 1.894,17.136 1.98,25.607c0.062,6.148 -8.016,6.736 -8.034,6.737l-15.123,0c0,0 -8.096,-0.583 -8.033,-6.737c0.085,-8.471 0.212,-22.4 1.979,-25.607c1.645,-2.986 8.416,-9.525 13.616,-9.642l0.061,0.002Z"></path>
      <path class="pad-button" d="M56.462,67.32c-0.166,5.192 -6.666,11.916 -9.64,13.554c-3.207,1.767 -17.136,1.894 -25.608,1.98c-6.147,0.062 -6.735,-8.016 -6.737,-8.034l0,-15.123c0,0 0.583,-8.096 6.737,-8.033c8.472,0.085 22.401,0.212 25.608,1.979c2.986,1.645 9.525,8.416 9.641,13.616l-0.001,0.061Z"></path>
    </g>
  </svg>
</div>

<div class="wrapper wrapper-right">
  <svg
    class="mobile translucent front control-button"
    class:pressed={ buttonDown }
    draggable="false"
    
    on:touchstart={handleButtonDown}
    on:touchend={handleButtonUp}
    on:touchcancel={handleButtonUp}
    
    on:mousedown={handleButtonDown}
    on:mouseup={handleButtonUp}
    
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 65 65"
    version="1.1"
  >
      <circle cx="32.452" cy="32.452" r="28.702" style="stroke:#ebebeb;stroke-width:7.5px;"></circle>
  </svg>
</div>
