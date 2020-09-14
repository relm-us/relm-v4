import { switchVideo } from './chat.js'

function toggleScreenShare(stage) {
  console.log('toggleScreenShare')
  switchVideo().then((isCamera) => {
    stage.player.goals.video.update({ cam: isCamera })
  })
}

export { toggleScreenShare }
