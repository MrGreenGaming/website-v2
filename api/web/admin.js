// ADMIN PAGE ROUTES
// Will be reauth with access token
// https://www.mrgreengaming.com/forums/api/core/me?access_token=

const axios = require('axios')
const express = require('express')
const app = (module.exports = express())
const NodeCache = require('node-cache')

/**
 * Admin verification
 */
// Cache member to auth token
// TODO: Should use proper auth headers instead of token in body
const adminAuthCache = new NodeCache({ stdTTL: 1800 })
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

  const authToken = req.body.authToken || req.query.authToken || false

  // Check if token is present
  if (!authToken) {
    deny(1, 'No auth token')
    return
  }
  // Remove token from query
  req.query.authToken = null
  req.body.authToken = null
  // Test if token is correct
  let returnedData
  let member
  if (adminAuthCache.get(authToken)) {
    member = adminAuthCache.get(authToken)
  } else {
    try {
      returnedData = await axios.get(
        'https://www.mrgreengaming.com/forums/api/core/me?access_token=' +
					authToken
      )
      member = returnedData.data
    } catch (err) {
      res.status(500)
      res.json({
        error: 2,
        errorMessage: 'Authorization failed'
      })
      return
    }
  }

  // Only members of this group are authorized
  const allowedGroups = ['TopCrew', 'Managers']
  if (
    !member.primaryGroup ||
		!member.primaryGroup.name ||
		!allowedGroups.includes(member.primaryGroup.name)
  ) {
    deny(3, 'User not authorized for admin')
    return
  }

  // Cache auth
  adminAuthCache.set(authToken, member)

  // User is authorized, pass user and continue on route
  res.locals.user = member

  next()
})

// Add gc or vip by admin
app.post('/addresources', async (req, res) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500).json({
      error: errorCode || 0,
      errorMessage: errorMessage || ''
    })
  }

  // Check body
  if (!req.body || !req.body.type || !req.body.amount || !req.body.receiverid) {
    deny(1, 'Invalid request')
    return
  }
  // Check type
  const allowedTypes = ['greencoins', 'vip']
  if (!allowedTypes.includes(req.body.type)) {
    deny(2, 'Invalid type')
    return
  }
  // Check amount
  if (!parseInt(req.body.amount, 10)) {
    deny(3, 'Invalid amount')
    return
  }
  // Check receiving member forum id
  if (!parseInt(req.body.receiverid)) {
    deny(4, 'Invalid forum id in query')
  }
  const sourceMember = res.locals.user
  const toMember = await Users.get(req.body.receiverid)
  if (!toMember) {
    deny(5, 'Could not fetch receiving member')
    return
  }
  // Log request
  try {
    await db.query(
      'INSERT INTO `website_settings_log`(`forumid`, `action_type`, `action`, `ip`) VALUES (?,?,?,?)',
      [
        sourceMember.id,
        'Changed user ' + req.body.type,
        JSON.stringify({
          receiver: req.body.receiverid,
          amount: req.body.amount
        }),
        10
      ]
    )
  } catch (e) {
    console.error('Failed logging /addresources:', e)
    deny(5, 'Db query failed')
    return
  }
  // Handle request
  if (req.body.type === 'greencoins') {
    // Give gc
    toMember
      .getCoins()
      .submitTransaction(
        parseInt(req.body.amount, 10),
        undefined,
        `Balance change by admin: ` +
					sourceMember.name +
					' #' +
					sourceMember.id,
        true
      )
  } else if (req.body.type === 'vip') {
    // Give vip
    const VipManager = require('../../server/base/vipManager')
    VipManager.addVip(req.body.receiverid, parseInt(req.body.amount, 10))
  }

  res.json({})
})

app.post('/changesetting', async (req, res) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500).json({
      error: errorCode || 0,
      errorMessage: errorMessage || ''
    })
  }

  // Check if everything is present
  if (!req.body || !req.body.setting || !req.body.value || !res.locals.user) {
    deny(1, 'Invalid request')
    return
  }

  // Log request
  try {
    await db.query(
      'INSERT INTO `website_settings_log`(`forumid`, `action_type`, `action`, `ip`) VALUES (?,?,?,?)',
      [
        res.locals.user.id,
        'Changed setting',
        req.body.setting + ' to ' + req.body.value,
        10
      ]
    )
  } catch (e) {
    console.error('Failed logging /addresources:', e)
    deny(2, 'Db query failed')
    return
  }

  // Set setting
  const SettingsManager = require('../../server/base/settings')
  await SettingsManager.setSetting(req.body.setting, req.body.value).catch(
    (err) => {
      console.error('Set setting error', err)
    }
  )

  res.json()
})

app.get('/getsettings', (req, res, next) => {
  const SettingsManager = require('../../server/base/settings')

  // Get Settings
  const returnSettings = {}
  for (const settingName in req.query) {
    if (settingName === 'authToken') break

    const setting = SettingsManager.getSetting(settingName)
    returnSettings[settingName] = setting
  }
  res.json(returnSettings)
})
