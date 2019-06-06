const express = require('express')
const app = (module.exports = express())
const NodeCache = require('node-cache')
const VipManager = require('../../server/base/vipManager')

// TODO: handle announcements with x_utf_l4g_core_announcements
const communityNewsCache = new NodeCache({ stdTTL: 7200 })
app.get('/communitynews', async (req, res, next) => {
  const axios = require('axios')
  const apiKey = Config.api.forums.apiKey
  // For now, lets keep a constant amount
  const amount = 10

  // let amount = req.query.amount;
  // if (!amount || isNaN(amount) || amount < 1) {
  // 	amount = 5;
  // }

  const cachedNews = communityNewsCache.get('news')
  if (cachedNews) {
    res.json(cachedNews)
    return
  }

  const news = await axios
    .get(
      'https://mrgreengaming.com/forums/api/forums/topics?perPage=' +
				amount +
				'&forums=2&hidden=0&page=1&sortBy=date&sortDir=desc&key=' +
				apiKey
    )
    .catch(() => {
      res.status(500)
      res.json({
        error: 1,
        errorMessage: 'Could not fetch community news.'
      })
    })

  // Trim data (no sensitive info) before sending it to client
  const trimmedNews = []
  for (const newsItem of news.data.results) {
    const trimmedNewsItem = {
      poll: newsItem.poll,
      posts: newsItem.posts,
      title: newsItem.title,
      url: newsItem.url,
      views: newsItem.views,
      firstPost: {
        content: newsItem.firstPost.content,
        date: newsItem.firstPost.date,
        author: {
          formattedName: newsItem.firstPost.author.formattedName,
          profileUrl: newsItem.firstPost.author.profileUrl,
          name: newsItem.firstPost.author.name
        }
      }
    }
    trimmedNews.push(trimmedNewsItem)
  }
  communityNewsCache.set('news', trimmedNews)
  res.json(trimmedNews)
})

app.get('/searchmembers', async (req, res, next) => {
  const axios = require('axios')
  const searchFor = req.query.name
  const apiKey = Config.api.forums.apiKey
  if (typeof searchFor !== 'string') {
    res.json('No valid search parameter given')
    return
  }
  const searchResults = await axios
    .get(
      'https://mrgreengaming.com/forums/api/core/members?key=' +
				apiKey +
				'&sortBy=name&page=1&name=' +
				searchFor
    )
    .catch(() => {
      res.status(500)
      res.json({
        error: 1,
        errorMessage: 'Could not fetch member search.'
      })
    })

  // Trim search results
  const trimmedSearchResults = []
  for (const searchItem of searchResults.data.results) {
    const trimmedSearchItem = {
      id: searchItem.id,
      name: searchItem.name,
      formattedName: searchItem.formattedName,
      photoUrl: searchItem.photoUrl,
      profileUrl: searchItem.profileUrl,
      primaryGroup: searchItem.primaryGroup
    }
    trimmedSearchResults.push(trimmedSearchItem)
  }
  res.json(trimmedSearchResults)
})

app.get('/forummember', async (req, res, next) => {
  // const axios = require("axios");
  const forumId = parseInt(req.query.forumId)
  // const apiKey = Config.api.forums.apiKey;

  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  if (typeof forumId !== 'number') {
    deny(1, 'No valid search forum id given')
    return
  }

  const ForumMembers = require('../../server/base/forumMembers')

  let theMember
  try {
    theMember = await ForumMembers.getForumMember(forumId)
  } catch (err) {
    console.error(err)
    deny(2, 'Could not fetch forum member')
    return
  }

  if (!theMember[0] || !theMember[0].id) {
    deny(3, 'Could not fetch forum member')
    return
  }

  const trimmedSearchResults = {
    id: theMember[0].id || false,
    name: theMember[0].name,
    formattedName: theMember[0].formattedName || false,
    photoUrl: theMember[0].photoUrl || false,
    profileUrl: theMember[0].profileUrl || false,
    primaryGroup: theMember[0].primaryGroup || false
  }

  res.json(trimmedSearchResults)
})

app.get('/getdonationpricing', (rec, res, next) => {
  // Get donation pricing and discount %
  const SettingsManager = require('../../server/base/settings')
  const settings = {}
  settings.gc = SettingsManager.getSetting('donation_gc')
  settings.vip = SettingsManager.getSetting('donation_vip')
  settings.vip_gc = SettingsManager.getSetting('donation_vip_gc')
  settings.discount = SettingsManager.getSetting('donation_discount')
  settings.minimum = SettingsManager.getSetting('donation_minimum')

  res.json(settings)
})

app.get('/getdonationgoal', (rec, res, next) => {
  // Get donation goal
  const SettingsManager = require('../../server/base/settings')
  const goal = SettingsManager.getSetting('donation_goal') || 55
  res.json(goal)
})

// const monthlyDonationCache = new NodeCache({ stdTTL: 1800 })
app.get('/getmonthdonations', (req, res, next) => {
  const DonationsManager = require('../../server/base/donationsManager')
  // let donations = monthlyDonationCache.get('donations')

  // if (!donations || donations.length === 0) {
  //   // Not in cache
  //   donations = []
  //   const thisMonth = new Date().getMonth() + 1

  //   let query
  //   try {
  //     query = await db.query(
  //       'SELECT * FROM `payments` WHERE MONTH(`date`) = ? ORDER BY `date` DESC',
  //       thisMonth
  //     )
  //   } catch (err) {
  //     console.error('Donations. problem fetching:', err)
  //     deny('Could not fetch donations')
  //     return
  //   }
  //   // Neaten up
  //   if (query.length > 0) {
  //     for (const row of query) {
  //       const insertRow = {
  //         name: 'Anonymous',
  //         amount: row.amount,
  //         date: row.date
  //       }
  //       donations.push(insertRow)
  //     }
  //   }
  // }
  res.json(DonationsManager.getMonthlyDonations())
})

app.get('/getmembercurrency', async (req, res, next) => {
  // Get user gc and vip
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  if (!req.query.forumid || !parseInt(req.query.forumid, 10)) {
    deny(1, 'No forumid given in query')
    return
  }
  const userId = parseInt(req.query.forumid, 10)

  const VipManager = require('../../server/base/vipManager')
  const Users = require('../../server/base/users')
  let user
  try {
    user = await Users.get(userId)
  } catch (error) {
    console.error(error)
    deny(2, 'Unknown user')
    return
  }

  if (!user) {
    deny(3, 'Could not fetch user')
    return
  }

  const returnedValue = {
    gc: user.getCoins().getBalance(),
    vip: VipManager.getVip(userId)
  }

  res.json(returnedValue)
})

app.get('/mtamaps', async (req, res, next) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  let dbUserResult
  try {
    const dbResults = await mtaServersDb.query(
      'SELECT * FROM `maps` ORDER BY `mapId` DESC'
    )
    if (dbResults && dbResults.length) {
      dbUserResult = dbResults
    }
  } catch (error) {
    deny(1, 'No Database Connection')
    return
  }

  res.json(dbUserResult || {})
})

app.get('/mtamaptoptimes', async (req, res, next) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  if (!req.query.mapName || typeof req.query.mapName !== 'string') {
    deny(1, 'No Map Name Specified')
    return
  }
  const resName = req.query.mapName.toLowerCase()

  let dbReturn
  try {
    const dbResults = await mtaServersDb.query(
      'SELECT * FROM `toptimes` WHERE LOWER(`mapname`) = ? ORDER BY `pos` ASC LIMIT 0,30',
      resName
    )
    if (dbResults && dbResults.length) {
      dbReturn = JSON.parse(JSON.stringify(dbResults))
    }
  } catch (error) {
    deny(2, 'No Database Connection')
    return
  }

  const ForumMembers = require('../../server/base/forumMembers')

  // Get forum member info
  const forumIds = []
  const forumIdToIndex = []

  // Put forumids in an array
  for (const index in dbReturn) {
    forumIds.push(dbReturn[index].forumid)
    forumIdToIndex['ID_' + dbReturn[index].forumid] = index
  }

  // Get forum member info
  await ForumMembers.getForumMember(forumIds, true)
    .then((res) => {
      // Add info to dbReturn
      for (const row of res) {
        if (row.id) {
          const index = forumIdToIndex['ID_' + row.id]
          dbReturn[index].formattedName = row.formattedName || false
          dbReturn[index].name = row.name || false
          dbReturn[index].profileUrl = row.profileUrl || false
          dbReturn[index].photoUrl = row.photoUrl || false
        }
      }
    })
    .catch((err) => {
      console.error(err)
      dbReturn = false
    })
  // Handle axios all (axiosCalls)
  // await axios
  // 	.all(axiosCalls)
  // 	.then(res => {
  // 		// Loop trough the response, adding the additional api returns to dbReturn
  // 		for (const data of res) {
  // 			const val = data.data;
  // 			const index = forumIdToIndex["ID_" + val.id];
  // 			if (val.id && index) {
  // 				dbReturn[index].formattedName = val.formattedName || false;
  // 				dbReturn[index].name = val.name || false;
  // 				dbReturn[index].profileUrl = val.profileUrl || false;
  // 				dbReturn[index].photoUrl = val.photoUrl || false;
  // 			}
  // 		}
  // 	})
  // 	.catch(err => {
  // 		console.error(err);
  // 		dbReturn = false;
  // 	});

  if (!dbReturn) {
    deny(3, 'Could not fetch forum members for top times')
  }
  res.json(dbReturn)
})

app.get('/getmembertops', async (req, res, next) => {
  // console.time("Api Calls");
  // TODO: Cache map list

  const ID = parseInt(req.query.forumid) || false
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  // const resName = req.query.mapName.toLowerCase();
  if (!ID || typeof ID !== 'number') {
    deny(1, 'No or invalid forumid Specified')
    return
  }

  let dbReturn
  try {
    const dbResults = await mtaServersDb.query(
      'SELECT * FROM `toptimes` JOIN `maps` ON toptimes.mapname = maps.resname WHERE `forumid` = ? AND `pos` <= 20 ORDER BY `pos` ASC',
      ID
    )
    if (dbResults && dbResults.length) {
      dbReturn = JSON.parse(JSON.stringify(dbResults))
    }
  } catch (error) {
    deny(1, 'No Database Connection')
    return
  }

  // Add IPB api info to members
  res.json(dbReturn || {})
})

app.get('/getleaderboardstop', async (req, res, next) => {
  // Specify what racemodes are valid
  const racemodes = {
    nts: true,
    race: true,
    dd: true,
    dl: true,
    sh: true,
    total: true,
    rtf: true
  }
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  let amount = 5
  const racemode = []
  let queryError = false

  // Validate query
  if (req.query.racemode && typeof req.query.racemode === 'string') {
    // One racemode requested
    const theMode = req.query.racemode.toLowerCase()
    if (!racemodes[theMode]) {
      queryError = true
    } else {
      racemode.push(theMode)
    }
  } else if (req.query.racemode && Array.isArray(req.query.racemode)) {
    // Handle requests

    for (const val of req.query.racemode) {
      if (typeof val !== 'string' || !racemodes[val.toLowerCase()]) {
        queryError = true
        break
      }

      racemode.push(val.toLowerCase())
    }
  } else {
    queryError = true
  }
  if (!isNaN(req.query.amount)) {
    amount = parseInt(req.query.amount)
  }
  // Throw error if query not valid
  if (queryError || racemode.length === 0) {
    deny(1, 'Racemode(s) not valid.')
    return
  }
  // Get leaderboard, then return appropriate data
  const leaderBoards = require('../../server/base/leaderboards')
  let leaderBoardsObject
  try {
    leaderBoardsObject = await leaderBoards.getItems()
  } catch (err) {
    console.error(err)
    deny(2, 'Could not fetch leaderboards')
    return
  }

  const returnObj = {}

  for (const mode of racemode) {
    const rankings = leaderBoardsObject[mode].slice(0, amount)
    // console.log(rankings);
    returnObj[mode] = rankings
  }

  res.json(returnObj)
})

app.get('/getmaplog', async (req, res, next) => {
  const page = req.query.page || 1
  let mapLog

  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  const mapUploads = require('../../server/mta/mapUploads')

  try {
    mapLog = await mapUploads.getMapLog(page)
  } catch (err) {
    deny(500, err.message || 'Problem fetching map log')
    return
  }

  res.json(mapLog)
})

const memberStatsCache = new NodeCache({ stdTTL: 1800 })
app.get('/getmemberstats', async (req, res, next) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  const theId = req.query.forumid
  if (!theId || !parseInt(theId, 10)) {
    deny(1, 'Invalid forum id.')
    return
  }

  // Check if in cache
  const cacheGet = memberStatsCache.get(theId)
  if (cacheGet) {
    res.json(cacheGet)
    return
  }

  const dbQuery =
		'SELECT `id1` AS "Race Starts", `id2` AS "Race Finishes", `id3` AS "Race Wins", `id4` AS "Checkpoints Collected", `id5` AS "Hours ingame", `id6` AS "Total deaths", `id7` AS "NTS Starts", `id8` AS "NTS Finishes", `id9` AS "NTS Wins", `id10` AS "RTF Starts", `id11` AS "RTF Wins", `id12` AS "DD Deaths", `id13` AS "DD Wins", `id14` AS "DD Kills", `id15` AS "CTF flags delivered", `id16` AS "Shooter Deaths", `id17` AS "Shooter Wins", `id18` AS "Shooter Kills" FROM `stats` WHERE `forumID`= ?'
  let statsReturned
  try {
    statsReturned = await mtaServersDb.query(dbQuery, theId)
  } catch (err) {
    console.error(err)
    deny(2, 'Problem fetching stats from db.')
    return
  }

  // Set in cache
  memberStatsCache.set(theId, statsReturned)

  res.json(statsReturned)
})

app.get('/getgameserverinfo', (req, res, next) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  if (!req.query.server) {
    deny(1, 'Invalid query')
    return
  }

  // if (
  // 	typeof req.query.server !== "string" ||
  // 	!Array.isArray(typeof req.query.server)
  // ) {
  // 	deny(2, "Invalid query");
  // 	return;
  // }
  let queryArray = []
  if (typeof req.query.server === 'string') {
    queryArray.push(req.query.server)
  } else if (Array.isArray(req.query.server)) {
    queryArray = req.query.server
  } else {
    deny(2, 'Invalid query')
    return
  }

  const GameserverManager = require('../../server/mta/gameserversManager')
  const returnVal = []

  for (const server of req.query.server) {
    const theInfo = GameserverManager.getServerInfo(server)
    returnVal.push(theInfo || false)
  }

  res.json(returnVal)
})

app.get('/getviphorns', async (req, res) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }
  const forumid = req.query.forumid
  if (!forumid || typeof parseInt(forumid) !== 'number') {
    deny(1, 'Invalid ID')
    return
  }

  await VipManager.getMemberHorns(parseInt(forumid)).then((theHorns) => {
    res.json(theHorns)
  }).catch((err) => {
    deny(2, err.message || 'Could not get VIP horns')
  })
})

// fetchUser aut endpoint
// Routed to here because fetchUser doesn't work with the forum /me endpoint
// Cache auth key for faster refetch
const authCache = new NodeCache({ stdTTL: 900 })
app.get('/me', async (req, res, next) => {
  const deny = (errorCode, errorMessage) => {
    res.status(500)
    res.json({
      error: errorCode || 0,
      errorMessage: errorMessage || 'An error occurred'
    })
  }

  if (
    !req.headers.authorization ||
		typeof req.headers.authorization !== 'string' ||
		req.headers.authorization.indexOf('Bearer ') !== 0
  ) {
    deny(1, 'No or invalid authorization send.')
    return
  }

  const authToken = req.headers.authorization.substring(7)

  // Check cache
  if (authCache.get(authToken)) {
    res.json(authCache.get(authToken))
    return
  }

  let endPointData
  let member
  try {
    endPointData = await axios.get(
      'https://www.mrgreengaming.com/forums/api/core/me?access_token=' +
				authToken
    )
    member = endPointData.data
  } catch (err) {
    deny(2, 'Authorization failed')
    return
  }
  // Get if member VIP
  member.vip = false
  if (VipManager.getVip(member.id)) {
    member.vip = true
  }

  // Set cache
  authCache.set(authToken, member)
  res.json(member)
})
