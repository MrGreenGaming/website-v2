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

app.post('/register', async (req, res) => {
  // MTA Ingame Registration Serial Field ID: 32
  let username = req.body.username
  let password = req.body.password
  const ipaddress = req.body.ip
  const email = req.body.email
  const serial = req.body.serial

  // Password Validation
  if (
  	typeof password !== 'string' ||
  	password.length < 8 ||
  	password.length > 150
  ) {
    res.json({
      error: 2,
      errorMessage: 'Invalid Password'
    })
    return
  }
  password = unescape(password)

  if (!/[a-z]/.test(password)) {
    res.json({
      error: 3,
      errorMessage: 'Password must contain lower case letter'
    })
    return
  } else if (!/[A-Z]/.test(password)) {
    res.json({
      error: 4,
      errorMessage: 'Password must contain upper case letter'
    })
    return
  } else if (!/[^a-zA-Z]/.test(password)) {
    res.json({
      error: 5,
      errorMessage: 'Password must contain number or special character'
    })
    return
  }

  // Username Validation
  if (
  	typeof username !== 'string' ||
  	username.length < 3 ||
  	username.length > 150
  ) {
    res.json({
      error: 6,
      errorMessage: 'Invalid Username'
    })
    return
  }
  username = unescape(username)

  if (/\s/.test(username)) {
    res.json({
      error: 7,
      errorMessage: 'Username can not contain whitespaces'
    })
    return
  } else if (/[^a-zA-Z0-9|_]/.test(username)) {
    res.json({
      error: 8,
      errorMessage: 'Username can only contain numbers, letter and _'
    })
    return
  }

  // Email validation
  if (typeof email !== 'string' || email.length < 4 || !/@/.test(email)) {
    res.json({
      error: 9,
      errorMessage: 'Email is not valid'
    })
    return
  }

  // IP validation
  if (typeof ipaddress !== 'string' || !/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
    res.json({
      error: 10,
      errorMessage: 'IP address is not valid'
    })
    return
  }

  const urlEncodedContent = new URLSearchParams()
  urlEncodedContent.append('name', username)
  urlEncodedContent.append('email', email)
  urlEncodedContent.append('password', password)
  urlEncodedContent.append('group', '3')
  urlEncodedContent.append('registrationIpAddress', ipaddress)
  urlEncodedContent.append('validated', '0')
  if (typeof serial === 'string') {
    urlEncodedContent.append('customFields[32]', serial)
  }
  let createMemberRes
  try {
    createMemberRes = await axios.post(`${global.Config.api.forums.apiBaseUrl}members/?key=${global.Config.api.forums.apiKey}`, urlEncodedContent, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  } catch (err) {
    switch (err.response.data.errorCode) {
      case '1C292/4':
        res.json({
          error: 11,
          errorMessage: 'The username provided is already in use'
        })
        return
      case '1C292/5':
        res.json({
          error: 12,
          errorMessage: 'The email address provided is already in use'
        })
        return
      default:
        res.json({
          error: 13,
          errorMessage: `Something went wrong. Error: ${err.response.data.errorCode || 'N/A'} - ${err.response.data.errorMessage || 'N/A'}`
        })
        return
    }
  }
  if (!createMemberRes.data || !createMemberRes.data.id) {
    res.json({
      error: 14,
      errorMessage: `Something went wrong while registering new member.`
    })
    return
  }

  let user
  try {
    user = await Users.get(createMemberRes.data.id)
  } catch (error) {
    console.error(error)
    res.json({
      error: 15,
      errorMessage: `User ${createMemberRes.data.id} registered successfully, but could not fetch details.`
    })
    return
  }

  if (!user) {
    res.json({
      error: 16,
      errorMessage: `User ${createMemberRes.data.id} registered successfully, but could not fetch details.`
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
