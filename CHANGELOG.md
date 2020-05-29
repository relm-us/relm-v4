
2020-05-24

- NEW: There is an "Export Only Selected Objects" checkbox in the /export page.
- NEW: The /select command now has /select locked and /select unlocked subcommands that select all locked or unlocked objects in the relm
- NEW: As a shortcut to /object delete, objects can be deleted with the 'delete' or 'backspace' keys (object must be selected first)
- CHANGED: Hint text to use the thought bar has changed from "Press Tab to Type" to "Press Enter to Type"
- FIXED: Possible jitsi race condition that prevented some video/audio from connecting
- FIXED: Border around videos is now more circular

2020-05-23

- NEW: Cmd+A (on Mac) or Ctrl+A (Linux/Windows) will select all objects in the relm (that are unlocked)
- NEW: ESC key deselcts all objects
- NEW: /select all command selects all, and /select none deselects every object
- NEW: Multiselect! You can shift+click on objects to add to the selection or ctrl-click to remove from the selection.
- NEW: Commands that work on objects now work on all selected objects.
- NEW: You can toggle lock/unlock state with keyboard shortcut "|" (shift+backslash). It operates on what your mouse pointer is hovering over.
- NEW: Some commands have new abbreviations:
  - /o = /object
  - /o f = /object fetch
  - /o i = /object info
  - /o r = /object rotate
  - /o s = /object scale
- CHANGED: You can no longer "secretly select" objects (i.e. click things to select but it wouldn't show it was selected). This was implemented previously so we could unlock locked objects. Use shift+\ (`|`) instead.
- CHANGED: /object up|down|left|right is now /orient up|down|left|right
- CHANGED: Removed some obscure commands (abracadabra, lockall, unlockall, etc.)
- CHANGED: /snap command now expects /snap off to turn grid snap off.
- CHANGED: /portal command is now its own command, and has subcommands, create, url, and radius. Use /portal create [URL] to create a portal, then /portal url https://relm.us/[RELM] to change its url, or /portal radius [RADIUS] to change its radius.
- CHANGED: Better toast message when objects are locked & unlocked
- CHANGED: Editor Mode (/mode editor) now allows selection of locked objects
- CHANGED: Locking and unlocking objects removes selection to indicate the action completed
- CHANGED: shift+\ shortcut for locking/unlocking now behaves as expected by acting on selected objects only
- FIXED: Issue with GLTF and GLB files would sometimes show "NaN" as scale and no object would appear

2020-05-21

- NEW: /snap [SIZE] command will give you a snap-to-grid feature when dragging objects with the mouse. A good value for SIZE is 300, since the marble tiles are 300x300.
- NEW: Ability to lock and unlock all objects in a relm.
- NEW: Uploaded assets (images like PNG, JPG, WebP, as well as 3D GLB files) are now saved as an MD5 so that we don't store duplicates (and client load time will potentially be faster)

2020-05-20

- NEW: There is now a "G" button on thought bubbles that will convert the thought into a gem/sign.
- NEW: Player names can now be edited directly
- CHANGED: Diamonds now have a spotlight directed toward the ground so you can see how high up they are.
- FIXED: Label positions are less laggy during animation frames

2020-05-19

- NEW: There is now a "My Character" button in the upper-right corner that allows you to select a character.
- NEW: First-time visitors will see the Character Selection screen right away.
- NEW: You can import and export an entire relm! /import and /export will bring up a textarea where you can export & copy, or paste & import.
- CHANGED: The "Invite" button has been temporarily removed since it isn't useful until we have locked relms.
- FIXED: The speed at which objects moved on others' screens when dragged is no longer slower than usual.
- FIXED: Removed the 'close' button from gem notes (diamonds/signs) since it didn't work and the proper way to close it is by clicking the gem again.
- FIXED: Thought bubbles are restored to their original location & have content shown as expected.

2020-05-18

- NEW: When two or more people are near you, if you zoom in as far is it will go, the camera will now drift toward the centroid of those near you, so it's easier to see everyone's video bubbles near the center of the screen.
- NEW: Double-tapping an arrow key will cause your character to speed-walk in that direction [Special thanks to Gary for the suggestion!]
- NEW: Signs can now have a message set (/sign message [MESSAGE]). Messages are pop-ups that appear when you click on a sign.
- NEW: Signs can now also have a label set (/sign label [LABEL]). Labels are zoom-invariant text underneath the sign.
- NEW: Right-click toast message now shows portal URLs
- NEW: /obj clone command now takes an optional [COUNT] parameter so you can make more than 1 clone at a time.
- NEW: If speech bubbles exceed capacity, they will now automatically convert to a rectangular format with scrollbar
- NEW: When sharing links, links are now clickable
- NEW: Right-click info panel now shows object locked status.
- NEW: You can change the URL of a Diamond link with /object changelink https://...
- NEW: You can create links to external websites with a new "interactive diamond" that indicates users can interact with / click on it. Use /link https://[url] to create a Link.
- CHANGED: When focused on the thought bar, hitting ESC will (in addition to putting focus back on the game) close the thought bubble, if open
- CHANGED: Thought bubble links are now only abbreviated after 30 characters (previously was 20)
- CHANGED: [MESSSAGE] is now an optional parameter of /sign create
- CHANGED: Renaming "Diamonds" to "Signs"
- CHANGED: Create a sign with /sign create [MESSAGE] (used to be /dia)
- CHANGED: Signs no longer need to be locked to be clickable.
- FIXED: Video bubbles no longer travel on top of the game UI buttons in the upper-right corner.
- FIXED: Video bubbles near the edge of the screen no longer drift away from the characters' centerlines.
- FIXED: You can now clone 3D objects (but you have to refresh to see them—secondary bug to be fixed later)
- FIXED: Large words don't cause empty speech bubble bug
- FIXED: Text in speech bubbles can now be copied to clipboard

2020-05-17

– NEW: Clicking on an already selected object will unselect it
– NEW: Portals can now be selected, deleted, moved
– NEW: You can now use /object clone to clone a selected object (including portals)
– CHANGED: Zoom now affects the video bubble size, so you can zoom in to your conversation
– CHANGED: Mouse clicks (and hover) are now more accurate, based on raycasting instead of approximate “nearest point”
– CHANGED: No more hover color (clicking is accurate enough that you don’t need to see annoying half-yellow state)
– FIXED: You can now click on things in the sky / halfway through the ground
– FIXED: Mouse wheel on Chrome+Windows platform now zooms more smoothly

– NEW: You can now add “x” and “z” url parameters to any Relm link and the character will be sent to that particular coordinate in a relm. Example: https://relm.us/relm?x=0&y=0 (sends someone to the center 0,0 coords of the default relm)
– CHANGED: New 2D objects now default to the “up” orientation rather than flat “down”
– CHANGED: The /link command has been changed to the /portal command

– NEW: You can stand objects up on the left or right, e.g. /obj left and /obj right
– CHANGED: Camera now focuses on character’s head. Zoom is affected most by this: on screens that are vertically short, you can now still see your video bubble
– CHANGED: Vignette effect is now white, in the distance

– NEW: You can now drag and drop objects on the X-Z plane with the mouse!
– NEW: Objects are now automaticaly selected after upload
– NEW: You can now rotate objects with the /obj rotate DEGREES command

– FIXED: Clicking on the “thought input box” no longer deselects the selected object
– FIXED: Buttons no longer take focus away from game controls
– FIXED: Video bubble no longer takes focus away from game controls
– FIXED: Clicking on the “mute/unmute” button no longer selects whatever object is behind it

– NEW: You can now /obj lock and /obj unlock an object. Locked objects can’t be visibly selected or moved.
– NEW: /obj commands now show their results as a toast pop-up

– NEW: There is now a /zoomrange max command that lets you zoom in and out farther than the default zoom range. /zoomrange default will set it back to normal.
– CHANGED: The “Help” button instructions are now a little more detailed.

– NEW: Character’s name is now underlined in color, and mouse pointer now matches that color.
– FIXED: Mouse wheel direction is natural direction for zoom
– FIXED: Offscreen player labels now stay inside the screen

– NEW: You can now upload 3D objects! GLBs and GLTFs are accepted. Currently, you can move & delete 3D objects, but not scale or rotate.

– FIXED: Scaled image objects now work and don’t disappear or move mysteriously

– NEW: 3D Objects are now normalized on first upload and can be scaled with /obj scale N command
– NEW: 3D Objects can now be rotated around the Y axis with /obj rotate DEGREES command

– NEW: Right-click on objects shows info about it: type, UUID, asset, position, scale, rotation. You can further click on the asset URL to be taken to the source image/GLTF.
– CHANGED: Style changes to pop-up messages (gray background)
– CHANGED: Hovering over pop-up messages now prevents pop-up from automatically disappearing. Clicking dismisses it.
– CHANGED: Higher maximum for default “zoom in” size