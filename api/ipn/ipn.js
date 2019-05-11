// Paypal IPN (Instant Payment Notification) post

const express = require('express')
const app = (module.exports = express())

app.post('/', (req, res, next) => {
  res.status(200).send('OK')
  res.end()
})
