const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const consola = require('consola')
const fse = require('fs-extra')

// export the server middleware
module.exports = {
  path: '/api',
  handler: app
}
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// Parse application/json
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// Fixes body being an array when coming from MTASA. Needs further investigation.
app.use('/', (req, res, next) => {
  if (req.body instanceof Array && req.body.length === 1) { req.body = req.body[0] }

  next()
})

app.use((error, req, res, next) => {
  if (!error.status) error.status = 500

  res.status(error.status)
  res.json({
    error: error.status,
    generated: new Date()
  })
})

// Cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )

  // intercepts OPTIONS method
  if (req.method === 'OPTIONS') {
    // respond with 200
    res.send(200)
  } else {
    next()
  }
})
app.options('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  )
  res.send(200)
})

// Root api
app.post('/', function (req, res, next) {
  res.json({
    helloWorld: 'Hi!',
    generated: new Date()
  })
})

app.get('/', (req, res, next) => {
  res.json({
    helloWorld: 'Hi!',
    generated: new Date()
  })
})

// Handle paypal's IPN posts
app.post('/ipn', async function (req, res, next) {
  // Paypal Instand Payment Notification
  res.status(200).send('OK')
  res.end()

  const body = req.body || {}

  // Validate IPN message with PayPal
  const PayPalService = require('../server/payment/paypal-ipn')
  try {
    const isValidated = await PayPalService.validate(body)
    if (!isValidated) {
      consola.error('Error validating IPN message.')
      return
    }
  } catch (err) {
    consola.error(err)
    return
  }
  // Handle the IPN message
  PayPalService.handle(body)
})

// Vip horns file serve
app.get('/viphorn', async function (req, res) {
  const id = req.query.id
  const hornPath = '././clientUploads/vipHorns/'
  if (!id || typeof id !== 'string') {
    res.json('Invalid ID')
    return
  }
  const file = hornPath + id + '.mp3'
  const exists = await fse.pathExists(file)
  if (exists) {
    res.download(file)
  } else {
    res.status(400).send('File doesnt exist')
  }
})

const md5File = require('md5-file')
app.get('/viphornchecksum', async function (req, res) {
  const id = req.query.id
  const hornPath = '././clientUploads/vipHorns/'
  if (!id || typeof id !== 'string') {
    res.status(400).send('Invalid ID')
    return
  }
  const file = hornPath + id + '.mp3'
  const exists = await fse.pathExists(file)
  if (exists) {
    md5File(file, (err, hash) => {
      if (err) {
        res.status(400).send('Could not get checksum')
      } else {
        res.send(hash.toUpperCase())
      }
    })
  } else {
    res.status(400).send('File doesnt exist')
  }
})

// Routes
app.use('/web', require('./web/web'))
app.use('/mapupload', require('./web/mapupload'))
app.use('/hornupload', require('./web/hornupload'))
app.use('/admin', require('./web/admin'))
app.use('/account', require('./account/account'))
app.use('/users', require('./account/users'))
app.use('/custompaintjobs', require('./mta/customPaintjobs'))

// Catch all for 404 error
app.all('*', (req, res) => {
  const errorStatusCode = 404
  res.status(errorStatusCode)
  res.json({
    error: errorStatusCode,
    generated: new Date()
  })
})
