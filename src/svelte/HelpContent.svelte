<script>
  import Thought from './Thought.svelte'
</script>

<div class="wrapper">

  <h2>Welcome!</h2>

  <div>
    <div class="p">
      Welcome to Relm! We're under construction, but if you want to kick the
      tires like a pro, we've documented some advanced commands you can use
      below.
    </div>
  </div>

  <h2>Writing Thoughts</h2>

  <div>
    <div class="p">
      Here is the
      <i>thought bar</i>
      :
      <Thought />
    </div>
    <div class="p">
      Your
      <i>thought bar</i>
      is at the bottom of the screen. You can use it to chat or share your
      status with your team:
      <Thought text="I'm working on a new design--show you soon!" />
    </div>
    <div class="p">
      And you can also use it to type commands that start with "/" (see below).
    </div>
  </div>

  <h2>Screen Sharing</h2>

  <div>
    <div class="p">
      Share your screen:
      <Thought text="/share" />
      (Other players can click on your screen to make it go fullscreen)
    </div>
  </div>

  <h2>General Stuff with Objects</h2>
  <div>
    <div class="p">
      First, click an object so it shines bright yellow, then try one of these:
    </div>
    <div class="p">
      Move it with the mouse: this moves the object in the X/Z directions
    </div>
  </div>

  <div>
    <div class="p">Get information about an object:</div>
    <Thought text="/object info" />
    <div>
      (Note that you can also right-click an object to get the same info).
    </div>
  </div>

  <h3>Scaling & Rotating</h3>

  <div>
    <div class="p">
      Grow or shrink an object (N should be between about 0.5 and 2):
    </div>
    <Thought text="/object scale [N]" />
    <div class="p">You can also scale in just one dimension:</div>
    <Thought text="/object scalex|scaley|scalez [N]" />
    (Note that "|" here means "or", so you can pick one of "scalex" or "scaley"
    or "scalez")
  </div>

  <div>
    <div class="p">Change flat object orientation:</div>
    <Thought text="/object orient up|down|left|right" />
    (Note that "|" here means "or", so you can pick one of "up" or "down" or
    "left" or "right")
  </div>

  <div>
    <div class="p">Rotate an object:</div>
    <Thought text="/object rotatex|rotatey|rotatez [DEGREES]" />
    (Note that "|" here means "or", so you can pick one of "rotatex" or
    "rotatey" or "rotatez")
  </div>

  <h3>Moving Objects</h3>

  <div>
    <div class="p">Bring object to you:</div>
    <Thought text="/object fetch" />
  </div>

  <div>
    <div class="p">Move an along an axis:</div>
    <Thought text="/object x|y|z [UNITS]" />
  </div>

  <div>
    <div class="p">You can also move an object to absolute position:</div>
    <Thought text="/object to [X] [Y] [Z]" />
  </div>

  <h3>Misc. Object Capabilities</h3>

  <div>
    <div class="p">Delete an object</div>
    <Thought text="/object delete" />
  </div>

  <div>
    <div class="p">
      Clone (duplicate) an object:
      <Thought text="/object clone [COUNT]" />
      (
      <pre class="inline">[COUNT]</pre>
      is optional, default is 1)
    </div>
  </div>

  <div>
    <div class="p">
      Flip the texture on an object:
      <Thought text="/object flip x|y" />
    </div>
  </div>

  <div>
    <div class="p">
      Fold a flat object so that part of it is on the ground:
      <Thought text="/object fold [PERCENT]" />
      (
      <pre class="inline">[PERCENT]</pre>
      is a number from 0 to 1)
    </div>
  </div>

  <div>
    <div class="p">
      Lock or unlock and object:
      <Thought text="/object lock|unlock" />
    </div>
  </div>

  <div>
    <div class="p">
      Change the material type of a 2D object:
      <Thought text="/object material default|photo|add|subtract|multiply" />
    </div>
  </div>

  <div>
    <div class="p">
      Change the layer of a 2D object:
      <Thought text="/object layer [N]" />
      (
      <pre class="inline">[N]</pre>
      is a number between 0 and 100)
    </div>
  </div>

  <h2>Special Objects</h2>

  <h3>Portals</h3>

  <div>
    <div class="p">
      Create a portal:
      <Thought text="/portal create [RELM] [X] [Z]" />
      (
      <pre class="inline">[RELM]</pre>
      is optional and is the name of a relm, e.g. 'welcome' would teleport to
      https://relm.us/welcome).
      <pre class="inline">[X]</pre>
      and
      <pre class="inline">[Z]</pre>
      are optional as well.
    </div>
  </div>

  <div>
    <div class="p">
      Update a selected portal:
      <Thought text="/portal update [RELM] [X] [Z]" />
    </div>
  </div>

  <h3>Trigger Plates</h3>

  <div>
    <div class="p">
      Create a trigger:
      <Thought text="/trigger create [JSON]" />
      (
      <pre class="inline">[JSON]</pre>
      is exported JSON. See the
      <pre class="inline">/export</pre>
      command).
    </div>
  </div>

  <div>
    <div class="p">
      Update a trigger:
      <Thought text="/trigger update [JSON]" />
    </div>
  </div>

  <h3>Diamond Indicators</h3>

  <div>
    <div class="p">
      Create a diamond:
      <Thought text="/diamond create [MESSAGE]" />
    </div>
  </div>

  <div>
    <div class="p">
      Set a message on a selected diamond:
      <Thought text="/diamond message [MESSAGE]" />
    </div>
  </div>

  <div>
    <div class="p">
      Set a label on a selected diamond:
      <Thought text="/diamond label [LABEL]" />
    </div>
  </div>

  <h3>Ground</h3>

  <div>
    <div class="p">
      Create a section of ground:
      <Thought text="/ground create [TEXTURE_URL]" />
      (
      <pre class="inline">[TEXTURE_URL]</pre>
      is an optional URL of an image that will be used for a repeating ground
      texture. It must begin with https://...)
    </div>
  </div>

  <div>
    <div class="p">
      Change the size of a selected section of ground:
      <Thought text="/ground size [N]" />
    </div>
  </div>

  <div>
    <div class="p">
      Change the color of a selected section of ground:
      <Thought text="/ground color [HEX]" />
      (
      <pre class="inline">[HEX]</pre>
      is a CSS hex color, e.g. '#FFFFFF' for white)
    </div>
    <div class="p">
      Change the texture image of a selected section of ground:
      <Thought text="/ground texture [TEXTURE_URL]" />
    </div>
    <div class="p">
      Change the texture's repeat frequency:
      <Thought text="/ground repeat [N]" />
    </div>
  </div>

  <div>
    <div class="p">
      Change the type of a selected section of ground:
      <Thought text="/ground type circle|square|rough" />
      (Note:
      <pre class="inline">rough</pre>
      means a 'roughly circular' shape).
    </div>
    <div class="p">
      Change the 'roughly circular' random seed:
      <Thought text="/ground random [N]" />
      (
      <pre class="inline">[N]</pre>
      is optional)
    </div>
  </div>

  <h3>Skybox</h3>

  <div>
    <div class="p">
      Change the skybox:
      <Thought text="/skybox [IMAGE_URL]" />
    </div>
  </div>

  <h2>Edit (Import / Export)</h2>

  <div>
    <div class="p">
      Select some objects and either right-click or:
      <Thought text="/edit" />
      You can copy/paste or modify world state this way.
    </div>
  </div>

  <h2>Selection</h2>

  <div>
    <div class="p">
      Select all:
      <Thought text="/select all" />
      (Note: you can also use ctrl+A or cmd+A)
    </div>
    <div class="p">
      Select none:
      <Thought text="/select none" />
      (Note: you can also press ESC)
    </div>
  </div>

  <div>
    <div class="p">
      Select locked:
      <Thought text="/select locked" />
      (Selects just the locked objects in the relm)
    </div>
    <div class="p">
      Select unlocked:
      <Thought text="/select unlocked" />
      (Selects just the unlocked objects in the relm)
    </div>
  </div>

  <h2>Misc.</h2>

  <div>
    <div class="p">
      Find out what your coordinates are:
      <Thought text="/whereami" />
    </div>
    <div class="p">
      Go to specified coordinates:
      <Thought text="/go [RELM] [X] [Z]" />
      (If
      <pre class="inline">[RELM]</pre>
      is omitted, you will stay in the current relm)
    </div>
  </div>

  <div>
    <div class="p">
      Change major mode:
      <Thought text="/mode editor|normal" />
    </div>
  </div>

  <div>
    <div class="p">
      Reset everything about your character (clears localStorage):
      <Thought text="/reset" />
    </div>
  </div>

  <div>
    <div class="p">
      Snap to grid:
      <Thought text="/snap off|[SIZE] [X-OFFSET=0] [Z-OFFSET=0]" />
    </div>
  </div>

  <div style="margin-bottom:150px" />
</div>

<style>
  h2 {
    margin-top: 45px;
  }
  div {
    margin-top: 25px;
  }
  div.p {
    margin-top: 5px;
    margin-bottom: 5px;
  }
  pre {
    font-size: 16px;
    background-color: #e0e0e0;
    padding: 3px 5px;
    margin-left: 15px;
  }
  pre.inline {
    margin-left: 0px !important;
    display: inline;
  }
  .wrapper > * {
    margin-left: 20px;
    margin-right: 20px;
  }
</style>
