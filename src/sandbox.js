import Sandbox from './Sandbox.svelte'

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

JitsiMeetJS.init({
  audioLevelsInterval: 40,
})

new Sandbox({
  target: document.body,
})
