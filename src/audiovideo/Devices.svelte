<script>
  // import Device from './Device.js'
  let available = JitsiMeetJS.mediaDevices.isDeviceListAvailable()

  const canChangeOutputDevice = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(
    'output'
  )
  const canChangeInputDevice = JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(
    'input'
  )

  let devices = {
    audioinput: {},
    audiooutput: {},
    videoinput: {},
  }

  JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) => {
    for (const device of deviceList) {
      devices[device.kind][device.deviceId] = device
    }
  })
</script>

<style>
  .devices {
    border: 2px solid #888;
    border-radius: 8px;
    padding: 8px 15px;
  }
</style>

<div class="devices">
  <div class="heading">Device List</div>
  <div class="available">
    Input:
    <span class="setting">
      {canChangeInputDevice ? 'can change' : 'cannot be changed'}
    </span>
  </div>
  <div class="available">
    Output:
    <span class="setting">
      {canChangeOutputDevice ? 'can change' : 'cannot be changed'}
    </span>
  </div>
  {#if available}
    <div class="list">
      {#each Object.values(devices.audioinput) as device}
        <div class="device">Audio Input: {device.label}</div>
      {/each}
      {#each Object.values(devices.audiooutput) as device}
        <div class="device">Audio Output: {device.label}</div>
      {/each}
      {#each Object.values(devices.videoinput) as device}
        <div class="device">Video Input: {device.label}</div>
      {/each}
    </div>
  {:else}
    <div class="available">Not available</div>
  {/if}
</div>
