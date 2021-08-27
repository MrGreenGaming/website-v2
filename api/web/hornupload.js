const path = require('path')
const fse = require('fs-extra')
const express = require('express')
const app = (module.exports = express())
const multer = require('multer')
const HornUploadManager = require('../../server/mta/hornUpload')
const VipManager = require('../../server/base/vipManager')

// Delete VIP horn
app.post('/removeviphorn', async (req, res) => {
  const deny = (errorCode, errorMessage) => {
    res.status(400).json({
      error: errorCode || 0,
      errorMessage: errorMessage || ''
    })
  }
  const hornid = req.body.data.hornid
  if (!hornid || typeof hornid !== 'number') {
    deny(5, 'Invalid horn ID')
    return
  }

  let userForumId
  if (!req.headers.authorization) {
    // No auth header
    res.status(401)
    res.json({
      error: 1,
      errorMessage: 'User authorization failed. Please re-login to the website'
    })
  } else {
    // Check auth
    const authToken = req.headers.authorization.substr(7)
    let returnedData
    let member
    try {
      returnedData = await axios.get(
        'https://forums.mrgreengaming.com/api/core/me?access_token=' + authToken
      )
      member = returnedData.data
    } catch (err) {
      res.status(401)
      res.json({
        error: 2,
        errorMessage: 'User authorization failed. Please re-login to the website'
      })
      return
    }
    if (!member.name || !member.id) {
      res.status(401)
      res.json({
        error: 3,
        errorMessage: 'User authorization failed. Please re-login to the website'
      })
      return
    } else {
      userForumId = member.id
    }

    // Delete file, no need for await
    VipManager.removeMemberHorn(userForumId, hornid)
    res.json()
  }
})

// Upload VIP horn
const fileFilter = function (req, file, cb) {
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3'
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Wrong file type')
    error.code = 'LIMIT_FILE_TYPES'
    return cb(error, false)
  }
  cb(null, true)
}

const maxSize = 1000000 // in bytes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '././clientUploads/vipHorns/temp/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
})

const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: maxSize
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
  let userForumId
  if (!req.headers.authorization) {
    // No auth header
    res.status(401)
    res.json({
      error: 1,
      errorMessage: 'User authorization failed. Please re-login to the website'
    })
    return
  } else {
    // Check auth
    const authToken = req.headers.authorization.substr(7)
    let returnedData
    let member
    try {
      returnedData = await axios.get(
        'https://forums.mrgreengaming.com/api/core/me?access_token=' + authToken
      )
      member = returnedData.data
    } catch (err) {
      res.status(401)
      res.json({
        error: 2,
        errorMessage: 'User authorization failed. Please re-login to the website'
      })
      return
    }
    if (!member.name || !member.id) {
      res.status(401)
      res.json({
        error: 3,
        errorMessage: 'User authorization failed. Please re-login to the website'
      })
      return
    } else {
      userForumId = member.id
    }
  }

  // Handle VIP horn upload
  let hasError = false
  await HornUploadManager.uploadVipHorn(userForumId, req.file).then((res) => {
    console.log('Vip horn: uploaded new horn for ' + userForumId)
  }).catch((err) => {
    console.log(err)
    hasError = err.message
  }).finally(() => {
    // Remove file
    fse.remove(req.file.path).catch((err) => {
      console.error(err)
    })

    if (hasError) {
      deny(4, hasError)
    } else {
      res.json()
    }
  })
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
    deny(422, 'Only .mp3 files allowed')
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    deny(422, 'File is too large. Max size is ' + maxSize / 1000 + 'KB')
  }
})
