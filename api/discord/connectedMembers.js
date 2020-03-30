const express = require('express')
const app = (module.exports = express())
const connectedMembersManager = require('../../server/discord/connectedDiscordMembersManager')

/**
 * API verification
 */
app.use('/', async (req, res, next) => {
  /**
	 *
	 * @param {number} [errorCode=0]
	 * @param {string} [errorMessage]
	 */
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'No API access'
    })
  }
  // Check app id presence
  const appId = (req.appId = req.body.appId =
		typeof req.body.appId === 'number'
		  ? req.body.appId
		  : typeof req.body.appId === 'string'
		    ? parseInt(req.body.appId, 10)
		    : undefined)
  if (isNaN(appId)) {
    deny(1, 'Invalid App ID')
    return
  }

  // Check app secret presence
  if (typeof req.body.appSecret !== 'string' || !req.body.appSecret) {
    deny(2, 'Invalid App Secret')
    return
  }

  const apiApp = ApiApps.get(appId)
  if (!apiApp) {
    deny(3, "App not available or secret doesn't match")
    return
  }

  let isMatch
  try {
    isMatch = await apiApp.verifySecretMatch(req.body.appSecret)
  } catch (error) {
    console.error(error)
    deny(3, 'Internal error occurred when verifying app')
    return
  }

  if (!isMatch) {
    deny(3, "App not available or secret doesn't match")
    return
  }

  next()
})

app.post('/all', async function (req, res) {
  try {
    const returnVal = await connectedMembersManager.getAll()
    res.json(returnVal)
  } catch (err) {
    console.error(err)
    res.status(500)
    res.json({
      error: 1,
      errorMessage: `Error trying to fetch all: ${err.message}`
    })
  }
})

app.post('/discordmember', async function (req, res) {
  const id = (req.query.id && !isNaN(req.query.id)) ? req.query.id : false
  if (!id) {
    res.status(500)
    res.json({
      error: 1,
      errorMessage: 'No ID specified'
    })
    return
  }
  try {
    const returnVal = await connectedMembersManager.getMemberConnectedByDiscordID(id)
    if (returnVal) {
      res.json(returnVal)
      return
    }
    res.status(500)
    res.json({
      error: 1,
      errorMessage: 'Connected member not found'
    })
  } catch (err) {
    console.log(err.message)
    res.status(500)
    res.json({
      error: 2,
      errorMessage: 'Problem fetching forum member'
    })
  }
})

app.post('/forummember', async function (req, res) {
  const id = (req.query.id && !isNaN(req.query.id)) ? req.query.id : false
  if (!id) {
    res.status(500)
    res.json({
      error: 1,
      errorMessage: 'No ID specified'
    })
    return
  }
  try {
    const returnVal = await connectedMembersManager.getMemberConnectedByForumID(id)
    if (returnVal) {
      res.json(returnVal)
      return
    }
    res.status(500)
    res.json({
      error: 1,
      errorMessage: 'Connected member not found'
    })
  } catch (err) {
    console.log(err.message)
    res.status(500)
    res.json({
      error: 2,
      errorMessage: 'Problem fetching forum member'
    })
  }
})
