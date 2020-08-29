import Sandbox from './Sandbox.svelte'

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

JitsiMeetJS.init({
  disableAudioLevels: true,
})

new Sandbox({
  target: document.body,
})
