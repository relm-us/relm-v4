import Sandbox from './Sandbox.svelte'

const JitsiMeetJS = window.JitsiMeetJS
console.log('Jitsi', JitsiMeetJS)

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR)

JitsiMeetJS.init({
  disableAudioLevels: true,
})

new Sandbox({
  target: document.body,
})
