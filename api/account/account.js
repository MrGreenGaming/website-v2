/**
 * This is a legacy API end-point
 */

const express = require('express')
const app = (module.exports = express())
const Users = require('../../server/base/users')
const VipManager = require('../../server/base/vipManager')

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

app.post('/login', async (req, res) => {
  let username = req.body.user
  let password = req.body.password

  if (
    typeof username !== 'string' ||
		typeof password !== 'string' ||
		username.length < 2 ||
		username.length > 150 ||
		password.length < 2 ||
		password.length > 150
  ) {
    res.json({
      error: 2,
      errorMessage: 'Input invalid'
    })
    return
  }

  username = unescape(username)
  password = unescape(password)

  let user
  try {
    user = await Users.authenticate(username, password)
  } catch (error) {
    console.error(error)
    res.json({
      error: 1,
      errorMessage: 'Internal error'
    })
    return
  }

  if (!user) {
    res.json({
      error: 7,
      errorMessage: 'Unknown user'
    })
    return
  }

  res.json({
    userId: user.getId(),
    user: user.getName(), // Deprecated
    name: user.getName(),
    emailAddress: undefined, // Deprecated
    profile: {
      photo: user.getAvatar(),
      photoThumb: user.getAvatarThumb(),
      title: undefined // Deprecated
    },
    coinsBalance: user.getCoins().getBalance(),
    joinDate: user.getCreated(),
    joinTimestamp: user.getCreated()
      ? Math.round(user.getCreated().getTime() / 1000)
      : undefined,
    vip: VipManager.getVip(user.getId()),
    banned: user.getBanned()
  })
})

app.post('/details', async (req, res) => {
  const userId = parseInt(req.body.userId, 10)
  if (isNaN(userId)) {
    res.json({
      error: 1,
      errorMessage: 'Invalid user'
    })
    return
  }

  let user
  try {
    user = await Users.get(userId)
  } catch (error) {
    console.error(error)
    res.json({
      error: 2,
      errorMessage: 'Unknown user'
    })
    return
  }

  if (!user) {
    res.json({
      error: 2,
      errorMessage: 'Unknown user'
    })
    return
  }

  res.json({
    userId: user.getId(),
    name: user.getName(),
    emailAddress: undefined, // Deprecated
    joinDate: user.getCreated(),
    joinTimestamp: user.getCreated()
      ? Math.round(user.getCreated().getTime() / 1000)
      : undefined,
    coinsBalance: user.getCoins().getBalance(),
    profile: {
      photo: user.getAvatar(),
      photoThumb: user.getAvatarThumb(),
      title: undefined // Deprecated
    },
    vip: VipManager.getVip(user.getId()),
    banned: user.getBanned()
  })
})

app.post('/details-multiple', async (req, res) => {
  const usersArray = req.body.users
  if (typeof usersArray !== 'object') {
    res.json({
      error: 1,
      errorMessage: 'Invalid users array'
    })
    return
  }

  if (usersArray.length < 1) {
    res.json({
      error: 1,
      errorMessage: 'Invalid users array'
    })
    return
  }

  const userReturn = []
  for (const requestedUser of usersArray) {
    const userId = parseInt(requestedUser.userId, 10)

    if (isNaN(userId)) {
      console.warn('userID NaN')
      continue
    }

    let user

    try {
      user = await Users.get(userId)
    } catch (error) {
      console.error(error)
      continue
    }

    if (!user) {
      continue
    }

    const singleUser = {
      users: user.getId(),
      name: user.getName(),
      emailAddress: undefined, // Deprecated
      joinDate: user.getCreated(),
      joinTimestamp: user.getCreated()
        ? Math.round(user.getCreated().getTime() / 1000)
        : undefined,
      coinsBalance: user.getCoins().getBalance(),
      profile: {
        photo: user.getAvatar(),
        photoThumb: user.getAvatarThumb(),
        title: undefined // Deprecated
      },
      vip: VipManager.getVip(user.getId()),
      banned: user.getBanned()
    }
    userReturn.push(singleUser)
  }
  res.json({ users: userReturn })
})
