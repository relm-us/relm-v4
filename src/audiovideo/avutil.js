/**
 * Attach a set of local tracks to a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
export function addLocalTracksToConference(conference, localTracks) {
  const conferenceLocalTracks = conference.getLocalTracks()
  const promises = []

  for (const track of localTracks) {
    // XXX The library lib-jitsi-meet may be draconian, for example, when
    // adding one and the same video track multiple times.
    if (conferenceLocalTracks.indexOf(track) === -1) {
      promises.push(
        conference.addTrack(track).catch((err) => {
          _reportError('Failed to add local track to conference', err)
        })
      )
    }
  }

  return Promise.all(promises)
}

/**
 * Remove a set of local tracks from a conference.
 *
 * @param {JitsiConference} conference - Conference instance.
 * @param {JitsiLocalTrack[]} localTracks - List of local media tracks.
 * @protected
 * @returns {Promise}
 */
export function removeLocalTracksFromConference(conference, localTracks) {
  return Promise.all(
    localTracks.map((track) =>
      conference.removeTrack(track).catch((err) => {
        // Local track might be already disposed by direct
        // JitsiTrack#dispose() call. So we should ignore this error
        // here.
        if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
          _reportError('Failed to remove local track from conference', err)
        }
      })
    )
  )
}

export async function canAutoPermit() {
  return new Promise((resolve) => {
    // If the browser allows us to enumerate any of the devices, then
    // there is at least some "permission" granted by the user from
    // the last time they visited. Take the hint and attempt to request
    // full permission to use audio & video.
    if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()) {
      JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) => {
        let autoPermit = false
        for (const device of deviceList) {
          if (device.label) autoPermit = true
        }
        resolve(autoPermit)
      })
    } else {
      resolve(false)
    }
  })
}

export async function getDeviceList() {
  return new Promise((resolve, reject) => {
    if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()) {
      JitsiMeetJS.mediaDevices.enumerateDevices((deviceList) =>
        resolve(deviceList)
      )
    } else {
      reject(new Error('Device List not available'))
    }
  })
}

export function getDefaultDeviceId(devices, kind) {
  const deviceListOfKind = Object.values(devices[kind] || {})
  const defaultDevice = deviceListOfKind.find((d) => d.deviceId === 'default')

  let matchingDevice

  if (defaultDevice) {
    // Find the device with a matching group id.
    matchingDevice = deviceListOfKind.find(
      (d) => d.deviceId !== 'default' && d.groupId === defaultDevice.groupId
    )
  }

  if (matchingDevice) {
    return matchingDevice.deviceId
  } else if (deviceListOfKind.length >= 1) {
    return deviceListOfKind[0].deviceId
  }
}
