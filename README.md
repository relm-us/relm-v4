# Relm

Relm is an experimental game world that's meant for remote team collaboration:



## Installing for Local Development

You can get going pretty quickly if you have a nodejs environment set up:

```
yarn install
yarn start
```

We recommend node 10.15.3 at the time of this writing.

## Notes on the Refactor

Currently, the code is undergoing a fairly large refactor from a monolithic app to more of an ECS (entity-component-system) style of modularization. We're using [stampit](https://stampit.js.org/) as a way to create Components that interact with each other when added to an Entity.

If you want to get started understanding the code, check out `src/index2.html` for now. Eventually it will become `src/index.html`.

Project structure:

```
dist   - ephemeral directory, not part of git. Build artifacts go here.
public - assets that are loaded at run-time, e.g. images, meshes, animations
server - source code for the yjs data sync & websocket server
src    - source code for the browser-based game client
\- lib - pieces of sample code and external libraries we've modified.
```

## Why build a game environment for serious teams trying to get stuff done?

1. Games are fun, able to "steal" our attention, but often meaningless, unable to empower gamers to produce real market value in the world's economies.
2. While online gambling is rampant, the current generation of video games do not offer a net postive ROI for playing the game.
3. Unless you are a beta tester or selling virtual goods in game, most gamers can't play video games to pay their own rent.
4. Back in the real world: Work is often repetitive, draining and no fun, destroying morale worldwide.
5. A new generation of people seek to "work for themselves" by becoming "digital nomads" or "agency entrepreneurs" but even the successful ones end up lonelier than ever.
6. Good people everywhere are dying of loneliness and depression from a failed Internet paradigm which promised to bring people together through apps such as Facebook, LinkedIn, Instagram, SnapChat, Slack and Twitter.
7. People need the power to meet, create, laugh, collaborate and work together in fun, meaningful & empowering ways regardless of distance.

It's time for a video game that deepens your relationships with real people and pays you to play it!

## How can a fun video game pay me to play it?

1. By creating real economic value for the world's product, service, entertainment, digital and real estate markets as well as government, public and private sectors.
2. By bringing remote workers, collaborators and teams together into a collaborative game world
3. By empowering teams to develop deeper relationships and open up more meaningful levels of communication
4. By gamifying the boring tasks through fun social interactions, epic quests, and entertainment
5. By enabling teams to collaborate more effectively on product development, sales, support, service delivery, analysis, marketing and other economic value drivers.
6. By creating better direction and clarity to team members through more accessible data and transparency such as in-game data feeds, visual charts, customer happiness feedback scores, email stats, marketing funnel stats, leaderboards, etc.
7. By bringing tools together, providing a social "melting pot" for all online tools like Trello, Github, Salesforce, Basecamp, Slack, Dropbox, Google Docs, Zapier, etc

## How does this solve loneliness and depression?

1. We believe loneliness and depression are often caused by a lack of real social connection and meaningful work. 
2. We believe current generation games and apps get in the way of real social connection and meaningful work.
3. We seek to enable remote workers to feel a sense of spatial collaboration, connection and expression not found anywhere else.
4. We seek to enable distant teams and families to work on meaningful projects together in a way that's more fun, playful and social than the current generation of apps and games.

## Sounds fun! But how can I play Relm?

(This is only a concept)

It's not ready yet.

Really.

You'll need to wait ...

But if you are super curious ...

You can play a pre-alpha version here:
https://relm.us 