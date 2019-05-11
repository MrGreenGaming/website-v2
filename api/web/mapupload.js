const path = require('path')
const fse = require('fs-extra')
// const axios = require('axios')
const express = require('express')
const app = (module.exports = express())
const multer = require('multer')
const ForumMessages = require('../../server/base/forumMessages')
// MAP UPLOAD

const fileFilter = function (req, file, cb) {
  const allowedTypes = [
    'application/zip',
    'application/zip-compressed',
    'application/x-zip-compressed',
    'application/zip',
    'multipart/x-zip'
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Wrong file type')
    error.code = 'LIMIT_FILE_TYPES'
    return cb(error, false)
  }
  cb(null, true)
}

const mapMaxSize = 10000000 // in bytes 10000000
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '././clientUploads/mapUploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
})

const upload = multer({
  // dest: "./clientUploads/mapUploads/",
  storage: storage,
  fileFilter,
  limits: {
    fileSize: mapMaxSize
  }
})

app.post('/upload', upload.single('file'), async (req, res) => {
  const deny = (errorCode, errorMessage) => {
    res.status(422).json({
      error: errorCode || 0,
      errorMessage: errorMessage || ''
    })
  }

  // Check user auth that posted
  let userName
  let userForumId
  if (!req.headers.authorization) {
    // No auth header
    deny(1, 'User authorization failed. Please re-login to the website.')
    return
  } else {
    // Check auth
    const authToken = req.headers.authorization.substr(7)
    let returnedData
    let member
    try {
      returnedData = await axios.get(
        'https://www.mrgreengaming.com/forums/api/core/me?access_token=' + authToken
      )
      member = returnedData.data
    } catch (err) {
      deny(2, 'User authorization failed. Please re-login to the website.')
      return
    }
    if (!member.name || !member.id) {
      deny(3, 'User authorization failed. Please re-login to the website.')
      return
    } else {
      userName = member.name
      userForumId = member.id
    }
  }

  // Check map comment
  const theComment = req.body.comment || false

  // Check map
  const mapUploads = require('../../server/mta/mapUploads')

  let uploadError = false
  let uploadType = 'New'
  await mapUploads
    .handleMapUpload(req.file, req.file.originalname, userName, userForumId, theComment)
    .then((res) => {
      // Response
      if (res === 'Update') {
        uploadType = 'Update'
      }
    })
    .catch((err) => {
      // error
      uploadError = err.message
    })

  // Remove files
  const folderName = req.file.filename.replace('.zip', '')
  const folderExists = await fse.pathExists('clientUploads/mapUploads/' + folderName)
  const zipExists = await fse.pathExists('clientUploads/mapUploads/' + req.file.filename)
  if (folderExists) {
    // Delete
    fse.remove('clientUploads/mapUploads/' + folderName).catch((err) => {
      console.log('Mapupload Folder Remove err:', err)
    })
  }
  if (zipExists) {
    // Delete
    fse.remove('clientUploads/mapUploads/' + req.file.filename).catch((err) => {
      console.log('Mapupload Zip Remove err:', err)
    })
  }

  if (uploadError) {
    deny(422, uploadError)
  } else {
    res.json(uploadType)
    // res.json({ files: req.files })
  }
})

app.use(function (err, req, res, next) {
  // Deny uploads
  const deny = (errorCode, errorMessage) => {
    res.status(422).json({
      error: errorCode || 0,
      errorMessage: errorMessage || ''
    })
  }

  if (err.code === 'LIMIT_FILE_TYPES') {
    // res.status(422).json({ error: "Only .zip files allowed" });
    deny(422, 'Only .zip files allowed')
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    // res.status(422).json({
    // 	error: "File is too large. Max size is " + mapMaxSize / 1000 + "KB"
    // });
    deny(422, 'File is too large. Max size is ' + mapMaxSize / 1000 + 'KB')
  }
})

// Notify map status (accept, accept/ decline)
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

app.post('/notifymapaction', async (req, res) => {
  const mapname = req.body.mapname
  const forumid = req.body.forumid
  const adminName = req.body.admin
  const resname = req.body.resname
  let reason = req.body.reason
  if (reason === '') {
    reason = 'No reason specified'
  }
  const status = req.body.mapstatus

  if (
    typeof forumid !== 'number' || typeof adminName !== 'string' ||
    typeof resname !== 'string' || typeof reason !== 'string' ||
    typeof status !== 'string' || typeof mapname !== 'string'
  ) {
    res.json({
      error: 2,
      errorMessage: 'Input invalid. (mapname, forumid, admin, resname, reason, mapstatus)'
    })
    return
  }
  // ForumMessages.sendMessage(target, title,body)
  let messageTitle = 'Your map "' + resname + ' has been '
  let sendError
  if (status === 'accepted') {
    messageTitle = messageTitle + 'accepted!'
    const messageBody = `<h1>Your uploaded map has been accepted!</h1>
    Your uploaded map <b>${mapname} (${resname})</b> has been accepted by <b>${adminName}</b>.<br>
    The map is now live on the server. Thank you for your contribution!<br>
    If you have any questions or problems, please contact one of our map managers.<br><br>
    <sub>This is an automated message. Please do not reply</sub>`
    await ForumMessages.sendMessage(forumid, messageTitle, messageBody).catch((err) => {
      console.error('Failed sending map notify: ', err)
      sendError = err
    })
  } else if (status === 'declined') {
    messageTitle = messageTitle + 'declined'
    const messageBody = `<h1>Your uploaded map has been declined</h1>
    Your uploaded map <b>${mapname} (${resname})</b> has been declined by <b>${adminName}</b> with the reason <b>"${reason}"</b>.<br>
    
    If you have any questions or problems, please contact one of our map managers.<br><br>
    <sub>This is an automated message. Please do not reply</sub>`
    await ForumMessages.sendMessage(forumid, messageTitle, messageBody).catch((err) => {
      console.error('Failed sending map notify: ', err)
      sendError = err
    })
  } else if (status === 'deleted') {
    messageTitle = messageTitle + 'deleted'
    const messageBody = `<h1>Your uploaded map has been deleted</h1>
    Your uploaded map <b>${mapname} (${resname})</b> has been deleted by <b>${adminName}</b> with the reason <b>"${reason}"</b>.<br>
    
    If you have any questions or problems, please contact one of our map managers.<br><br>
    <sub>This is an automated message. Please do not reply</sub>`
    await ForumMessages.sendMessage(forumid, messageTitle, messageBody).catch((err) => {
      console.error('Failed sending map notify: ', err)
      sendError = err
    })
  } else if (status === 'restored') {
    messageTitle = messageTitle + 'deleted'
    const messageBody = `<h1>Your uploaded map has been restored</h1>
    Your uploaded map <b>${mapname} (${resname})</b> has been restored by <b>${adminName}</b> with the reason <b>"${reason}"</b>.<br>
    
    If you have any questions or problems, please contact one of our map managers.<br><br>
    <sub>This is an automated message. Please do not reply</sub>`
    await ForumMessages.sendMessage(forumid, messageTitle, messageBody).catch((err) => {
      console.error('Failed sending map notify: ', err)
      sendError = err
    })
  } else {
    res.json({
      error: 3,
      errorMessage: 'Invalid map status, can be: accepted, declined, deleted, restored'
    })
    return
  }

  if (sendError) {
    res.json({
      error: 3,
      errorMessage: 'Failed sending forum message'
    })
  } else {
    res.json('Success')
  }
})
