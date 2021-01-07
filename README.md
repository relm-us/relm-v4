# Relm

Relm is a browser-based world that makes "virtual locality" possible--providing a way to be together with friends online in a community that meets more of our universal human needs than today's social networks do.

## Installing for Local Development

You can get going pretty quickly if you have a nodejs environment set up. You will need 2 server processes for basic multiplayer:

Browser client dev server:
```
yarn install
yarn start
```

Data sync server (yjs):
```
cd server
yarn install
yarn start
```

We recommend node 10.21.0 at the time of this writing.

## Project Structure

The Relm engine uses a loose ECS (entity-component-system) style of code organization. We're using [stampit](https://stampit.js.org/) as a way to create Components that interact with each other when added to an Entity.

If you want to get started understanding the code, check out `src/index.html`.

Project structure:

```
dist   - ephemeral directory, not part of git. Build artifacts go here.
public - assets that are loaded at run-time, e.g. images, meshes, animations
server - source code for the yjs data sync & websocket server
src    - source code for the browser-based game client
\- lib - pieces of sample code and external libraries we've modified.
```

See also NOTES.md for technical notes.

## Tell me more?

Please see our main site: https://www.relm.us for a bigger picture view, as well as more detail as we fill it in.


## Sounds fun! But how can I play Relm?

Relm is still in an incomplete state, under heavy development.

But if you are super curious ...

You can play an alpha version here:
[https://relm.us/welcome](https://relm.us/welcome) 
