const express = require('express')
const app = (module.exports = express())
const VipManager = require('../../server/base/vipManager')
const Utils = require('../utils')

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
  const appId = (req.appId = req.body.appId = Utils.parseToNumber(req.body.appId))

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

app.param('userId', async (req, res, next, userId) => {
  userId = parseInt(userId, 10)
  if (isNaN(userId)) {
    res.json({
      error: 1,
      errorMessage: 'Invalid User ID'
    })
    return
  }

  try {
    req.user = await Users.get(userId)
  } catch (error) {
    console.error(error)
    res.json({
      error: 0,
      errorMessage: 'Internal error'
    })
    return
  }

  if (!req.user) {
    res.json({
      error: 1,
      errorMessage: 'Unknown user'
    })
    return
  }

  next()
})

app.get('/:userId/summary', (req, res) => {
  /** @type {User} */
  const user = req.user

  res.json({
    userId: user.getId(),
    identifier: user.getIdentifier(),
    name: user.getName(),
    created: user.getCreated(),
    coinsBalance: user.getCoins().getBalance(),
    avatar: user.getAvatar(),
    avatarThumb: user.getAvatarThumb(),
    vip: user.getVip(),
    banned: user.getBanned(),
    generated: new Date()
  })
})

app.post('/:userId/coins/changeBalance', async (req, res) => {
  /** @type {User} */
  const user = req.user

  const amount = Utils.parseToNumber(req.body.amount)

  if (typeof amount !== 'number' || !amount) {
    res.json({
      error: 10,
      errorMessage: 'Invalid amount'
    })
    return
  }

  const output = {
    userId: user.getId(),
    generated: new Date()
  }

  // user.getCoins().changeBalance(amount);

  let coinsTransactionId
  try {
    coinsTransactionId = await user
      .getCoins()
      .submitTransaction(amount, req.appId, 'Balance change', true)
  } catch (error) {
    res.status(500)
    res.json({
      error: 0,
      errorMessage: 'Transaction error'
    })
    console.error(error)
    return
  }

  if (!coinsTransactionId) {
    output.error = 11
    output.errorMessage = 'Transaction denied'
  } else {
    output.coinsTransactionId = coinsTransactionId

    if (amount < 0) output.coinsTaken = Math.abs(amount)
    else output.coinsGiven = amount
  }

  // New balance
  output.coinsBalance = user.getCoins().getBalance()

  res.json(output)
})

app.post('/:userId/coins/submitTransaction', async (req, res) => {
  /** @type {User} */
  const user = req.user

  const amount = Utils.parseToNumber(req.body.amount)

  const comments =
		req.body.comments && req.body.comments.length < 1000
		  ? req.body.comments
		  : undefined

  if (typeof amount !== 'number' || !amount) {
    res.json({
      error: 10,
      errorMessage: 'Invalid amount'
    })
    return
  }

  const output = {
    userId: user.getId(),
    generated: new Date()
  }

  let coinsTransactionId
  try {
    coinsTransactionId = await user
      .getCoins()
      .submitTransaction(amount, req.appId, comments)
  } catch (error) {
    res.status(500)
    res.json({
      error: 0,
      errorMessage: 'Transaction error'
    })
    console.error(error)
    return
  }

  if (!coinsTransactionId) {
    output.error = 11
    output.errorMessage = 'Transaction denied'
  } else {
    output.coinsTransactionId = coinsTransactionId
    if (amount < 0) output.coinsTaken = Math.abs(amount)
    else output.coinsGiven = amount
  }

  // New balance
  output.coinsBalance = user.getCoins().getBalance()

  res.json(output)
})

app.post('/:userId/vip/addVip', async (req, res) => {
  /** @type {User} */
  const user = req.user
  const userid = user.getId()

  const amount = Utils.parseToNumber(req.body.amount)

  if (typeof amount !== 'number' || !amount) {
    res.json({
      error: 10,
      errorMessage: 'Invalid amount'
    })
    return
  }

  // Give vip
  try {
    await VipManager.addVip(userid, amount)
  } catch (error) {
    res.status(500)
    res.json({
      error: 0,
      errorMessage: `Transaction error: ${error.message || error}`
    })
    console.error(error)
  }
  res.json({
    success: true,
    id: userid,
    newBalance: VipManager.getVip(userid)
  })
})
