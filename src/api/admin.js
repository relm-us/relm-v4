import axios from 'axios'

import { config } from '../config.js'
import { Security } from '../security.js'

const security = Security()

const headersForPlayerId = async (playerId) => {
  return {
    'x-relm-id': playerId,
    'x-relm-s': await security.sign(playerId),
  }
}

async function createRelm(playerId, relmName, isPublic = true) {
  let url = `${config.SERVER_URL}/relm/${relmName}/create`
  try {
    const res = await axios.post(
      url,
      {
        isPublic,
      },
      {
        headers: await headersForPlayerId(playerId),
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

async function truncateRelm(playerId, relmName) {
  let url = `${config.SERVER_URL}/relm/${relmName}/truncate`
  try {
    const res = await axios.post(
      url,
      {},
      {
        headers: await headersForPlayerId(playerId),
      }
    )
    return true
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw Error(err.response.data.reason)
    } else {
      throw err
    }
  }
}

async function getRelmMetadata(playerId, relmName) {
  let url = `${config.SERVER_URL}/relm/${relmName}/meta`
  try {
    const res = await axios.get(url, {
      headers: await headersForPlayerId(playerId),
    })
    return res.data.relm
  } catch (err) {
    if (err && err.response && err.response.data) {
      throw Error(err.response.data.reason)
    } else {
      throw err
    }
  }
}

export { createRelm, truncateRelm, getRelmMetadata }
