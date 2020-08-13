import axios from 'axios'

import { config } from '../config.js'
import { Security } from '../security.js'

const cfg = config(window.location)
const security = Security()

async function createRelm(playerId, relmName, isPublic = true) {
  let url = `${cfg.SERVER_URL}/relm/${relmName}/create`
  try {
    const res = await axios.post(
      url,
      {
        isPublic,
      },
      {
        headers: {
          'x-relm-id': playerId,
          'x-relm-s': await security.sign(playerId),
        },
      }
    )
    return res.data.relm
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw Error(err.response.data.reason)
    } else {
      throw err
    }
  }
}

export { createRelm }
