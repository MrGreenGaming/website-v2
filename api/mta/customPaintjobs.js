const path = require('path')
const express = require('express')
const app = (module.exports = express())
const paintJobManager = require('../../server/mta/customPaintjobManager')

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

app.get('/getmd5', async (req, res) => {
  const pjArray = req.body.paintjobs
  if (!pjArray || typeof pjArray !== 'object') {
    res.json({
      error: 1,
      errorMessage: 'Invalid paintjob request'
    })
    return
  }
  let md5Obj
  try {
    md5Obj = await paintJobManager.getPaintjobMD5(pjArray)
  } catch (err) {
    console.log(err)
    res.json({
      error: 2,
      errorMessage: 'Invalid paintjob request'
    })
    return
  }
  res.json(md5Obj)
})

app.get('/getpaintjob', async (req, res) => {
  const paintjobId = req.body.id
  if (!paintjobId || typeof paintjobId !== 'string') {
    res.json({
      error: 1,
      errorMessage: 'Invalid paintjob request'
    })
    return
  }
  await paintJobManager.paintjobExists(paintjobId)
    .catch((err) => {
      console.error(err)
      res.json({
        error: 2,
        errorMessage: 'Could not check for paintjob existence'
      })
    }).then((exists) => {
      if (exists) {
        res.sendFile(path.resolve(__dirname, '../../clientUploads/customPaintjobs/' + paintjobId + '.bmp'))
      } else {
        res.json({
          error: 3,
          errorMessage: 'Could not find paintjob'
        })
      }
    })
})

app.post('/savepaintjob', (req, res) => {
  const id = req.body.id
  const data = req.body.data
  if (!id || typeof id !== 'string') {
    res.json({
      error: 1,
      errorMessage: 'No or invalid name in request'
    })
    return
  } else if (!data || typeof data !== 'string') {
    res.json({
      error: 2,
      errorMessage: 'No or invalid data in request'
    })
    return
  }
  paintJobManager.savePaintjob(data, id)
  res.json('Success!')
})
