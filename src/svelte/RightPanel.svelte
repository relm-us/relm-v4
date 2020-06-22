<script>
  import { chooseAvatarState } from './stores.js'
  
  let helpPanelOpen = false
  
  function preventDefault(event) {
    event.preventDefault()
  }

  function toggleShowPanel(event) {
    helpPanelOpen = !helpPanelOpen
    event.preventDefault()
  }
  
  function handleClickAvatar(event) {
    chooseAvatarState.update(value => true)
  }
</script>


<style>
.button {
  font-size: 18px;
  border-radius: 8px;
  border: 3px solid #efaa22;
  background: #eee;
  color: #333;
  padding: 5px 10px;
  
  cursor: pointer;
}
.button:hover {
  background: #fff;
  border-color: #ef9911;
}

#right-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  left: 20px;
  max-height: 100%;
  z-index: 3;
  
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}


#help-panel {
  overflow-y: auto;
  max-width: 100%;
}
#help-panel h2 {
  margin-top: 45px;
}
#help-panel div {
  margin-bottom: 45px;
}
#help-panel p {
  margin-top: 5px;
  margin-bottom: 5px;
}
#help-panel pre {
  font-size: 16px;
  background-color: #e0e0e0;
  padding: 3px 5px;
  margin-left: 15px;
}
#help-panel pre.inline {
  margin-left: 0px !important;
  display: inline;
}


.panel-button {
  margin-top: 5px;
}
.panel-subpanel {
  display: none;
  /* padding: 5px 10px; */
  margin-top: 5px;
  background: #fff;
  border-radius: 4px;
}
.panel-subpanel > * {
  margin-left: 20px;
  margin-right: 20px;
}
.panel-subpanel.show {
  display: block;
}


#invitation.show {
  display: block;
}
#invitation-input {
  width: 200px;
}
</style>

<div id="right-panel">
  
  <div id="my-character" class="panel-button button" on:click={ handleClickAvatar }>My Character</div>
  <!-- <div id="invite" class="panel-button button">Invite Others</div> -->
  <div id="invitation" class="panel-subpanel">Copy One-Time Link: <input id="invitation-input"/></div>
  <button id="upload-button" class="panel-button button" on:mousedown={preventDefault}>Upload</button>
  <div id="help-button" class="panel-button button" on:mousedown={ toggleShowPanel }>Help</div>

  <div id="help-panel" class="panel-subpanel" class:show={ helpPanelOpen }>
    <h2>Welcome!</h2>
    <div class="p">We're under construction, but if you want to kick the tires here are some advanced commands you can use:</div>
    
    <h2>General Stuff with Objects</h2>
    <div class="p">First, click an object so it shines bright yellow, then try one of these:</div>
    <div class="p">Move it with the mouse: this moves the object in the X/Z directions</div>

    <div>
      <div class="p">Get information about an object:<pre>/object info</pre> (Note that you can also right-click an object to get the same info).</div>
    </div>
    
    <h3>Scaling & Rotating</h3>
    
    <div>
      <div class="p">Grow or shrink an object (N should be between about 0.5 and 2):<pre>/object scale [N]</pre></div>
      <div class="p">You can also scale in just one dimension:<pre>/object scalex|scaley|scalez [N]</pre></div>
    </div>
    
    <div>
      <div class="p">Change flat object orientation:<pre>/object orient up|down|left|right</pre></div>
    </div>
    
    <div>
      <div class="p">Rotate an object:<pre>/object rotatex|rotatey|rotatez [DEGREES]</pre></div>
    </div>
    
    <h3>Moving Objects</h3>
    
    <div>
      <div class="p">Bring object to you:<pre>/object fetch</pre></div>
    </div>

    <div>
      <div class="p">Move an along an axis:<pre>/object x|y|z [UNITS]</pre></div>
    </div>

    <div>
      <div class="p">You can also move an object to absolute position:<pre>/object to [X] [Y] [Z]</pre></div>
    </div>
    
    <h3>Misc. Object Capabilities</h3>
    
    <div>
      <div class="p">Delete an object<pre>/object delete</pre></div>
    </div>
    
    <div>
      <div class="p">Clone (duplicate) an object:<pre>/object clone [COUNT]</pre>(<pre class="inline">[COUNT]</pre> is optional, default is 1)</div>
    </div>
    
    <div>
      <div class="p">Flip the texture on an object:<pre>/object flip x|y</pre></div>
    </div>
    
    <div>
      <div class="p">Fold a flat object so that part of it is on the ground:<pre>/object fold [PERCENT]</pre>(<pre class="inline">[PERCENT]</pre> is a number from 0 to 1)</div>
    </div>
    
    <div>
      <div class="p">Lock or unlock and object:<pre>/object lock|unlock</pre></div>
    </div>
    
    <div>
      <div class="p">Change the material type of a 2D object:<pre>/object material default|photo|add|subtract|multiply</pre></div>
    </div>
    
    <div>
      <div class="p">Change the layer of a 2D object:<pre>/object layer [N]</pre>(<pre class="inline">[N]</pre> is a number between 0 and 100)</div>
    </div>
    
    
    <h2>Special Objects</h2>


    <h3>Portals</h3>
    
    <div>
      <div class="p">Create a portal:<pre>/portal create [RELM] [X] [Z]</pre>(<pre class="inline">[RELM]</pre> is optional and is the name of a relm, e.g. 'welcome' would teleport to https://relm.us/welcome). <pre class="inline">[X]</pre> and <pre class="inline">[Z]</pre> are optional as well.</div>
    </div>
    
    <div>
      <div class="p">Update a selected portal:<pre>/portal update [RELM] [X] [Z]</pre></div>
    </div>
    
    
    <h3>Trigger Plates</h3>
    
    <div>
      <div class="p">Create a trigger:<pre>/trigger create [JSON]</pre>(<pre class="inline">[JSON]</pre> is exported JSON. See the <pre class="inline">/export</pre> command.</div>
    </div>
    
    <div>
      <div class="p">Update a trigger:<pre>/trigger update [JSON]</pre></div>
    </div>
    

    <h3>Diamond Indicators</h3>
    
    <div>
      <div class="p">Create a diamond:<pre>/diamond create [MESSAGE]</pre></div>
    </div>
    
    <div>
      <div class="p">Set a message on a selected diamond:<pre>/diamond message [MESSAGE]</pre></div>
    </div>
    
    <div>
      <div class="p">Set a label on a selected diamond:<pre>/diamond label [LABEL]</pre></div>
    </div>
    

    <h3>Ground</h3>
    
    <div>
      <div class="p">Create a section of ground:<pre>/ground create [TEXTURE_URL]</pre>(<pre class="inline">[TEXTURE_URL]</pre> is an optional URL of an image that will be used for a repeating ground texture. It must begin with https://...)</div>
    </div>
    
    <div>
      <div class="p">Change the size of a selected section of ground:<pre>/ground size [N]</pre></div>
    </div>
    
    <div>
      <div class="p">Change the color of a selected section of ground:<pre>/ground color [HEX]</pre>(<pre class="inline">[HEX]</pre> is a CSS hex color, e.g. '#FFFFFF' for white)</div>
      <div class="p">Change the texture image of a selected section of ground:<pre>/ground texture [TEXTURE_URL]</pre></div>
      <div class="p">Change the texture's repeat frequency:<pre>/ground repeat [N]</pre></div>
    </div>
    
    <div>
      <div class="p">Change the type of a selected section of ground:<pre>/ground type circle|square|rough</pre>(Note: <pre class="inline">rough</pre> means a 'roughly circular' shape.)</div>
      <div class="p">Change the 'roughly circular' random seed:<pre>/ground random [N]</pre>(<pre class="inline">[N]</pre> is optional)</div>
    </div>
    

    <h3>Skybox</h3>
    
    <div>
      <div class="p">Change the skybox:<pre>/skybox [IMAGE_URL]</pre></div>
    </div>

    
    <h2>Import / Export</h2>
    
    <div>
      <div class="p">Export the world, or just the selected objects:<pre>/export</pre>(Then copy the JSON)</div>
      <div class="p">Import into the world:<pre>/import</pre>(Then paste exported JSON in to the box)</div>
    </div>
    
    
    <h2>Selection</h2>

    <div>
      <div class="p">Select all:<pre>/select all</pre>(Note: you can also use ctrl+A or cmd+A)</div>
      <div class="p">Select none:<pre>/select none</pre>(Note: you can also press ESC)</div>
    </div>
    
    <div>
      <div class="p">Select locked:<pre>/select locked</pre>(Selects just the locked objects in the relm)</div>
      <div class="p">Select unlocked:<pre>/select unlocked</pre>(Selects just the unlocked objects in the relm)</div>
    </div>


    <h2>Misc.</h2>
    
    <div>
      <div class="p">Find out what your coordinates are:<pre>/whereami</pre></div>
      <div class="p">Go to specified coordinates:<pre>/go [RELM] [X] [Z]</pre>(If <pre class="inline">[RELM]</pre> is omitted, you will stay in the current relm)</div>
    </div>
    
    <div>
      <div class="p">Change major mode:<pre>/mode editor|normal</pre></div>
    </div>
    
    <div>
      <div class="p">Reset everything about your character (clears localStorage):<pre>/reset</pre></div>
    </div>
    
    <div>
      <div class="p">Snap to grid:<pre>/snap [SIZE|off]</pre></div>
    </div>
    
  </div>
</div>