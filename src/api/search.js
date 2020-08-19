import axios from 'axios'

let SERVER_URL
if (location.origin === 'https://relm.us') {
  SERVER_URL = 'https://y.relm.us'
} else if (location.origin === 'https://staging.relm.us') {
  SERVER_URL = 'https://y-staging.relm.us'
} else {
  SERVER_URL = `http://${location.hostname}:1235`
}

async function listPublicRelms() {
  let url = `${SERVER_URL}/relms/public`
  try {
    const res = await axios.get(url)
    return res.data.relms
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw Error(err.response.data.reason)
    } else {
      throw err
    }
  }
}

export { listPublicRelms }
