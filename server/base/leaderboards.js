const consola = require('consola')
const leaderBoardsRefreshTime = 60 // Refresh every x minutes
let leaderBoardModes = {
  // Modes that should be prefetched
  nts: true,
  race: true,
  dd: true,
  dl: true,
  sh: true,
  // total: true,
  rtf: true
}
leaderBoardModes = new Map(Object.entries(leaderBoardModes))

const badgeNames = {
  // Badge names as stated in forums
  // In event of changes to the forum badge names, change it here too!
  nts: 'Top NTS Badge',
  race: 'Top Race Badge',
  dd: 'Top DD Badge',
  dl: 'Top DL Badge',
  sh: 'Top SH Badge',
  rtf: 'Top RTF Badge'
  // total: 'Top Total Player Badge'
}
let customFieldsIds = new Map()

// badgeNames = new Map(Object.entries(badgeNames));

const playerTopAmountToReward = 5 // Reward top 5 in each mode with a badge
const amountToFetch = 100 // Prefetch amount from each mode

let leaderBoardsData = []
let greencoinsData = []
class leaderBoards {
  /**
	 * Initialize
	 * @return {void}
	 */
  static async initialize() {
    // Fetch leaderboards, if fail, retry
    // return new Promise(async (resolve, reject) => {
    consola.info('Leaderboards init: begin fetching and caching')
    try {
      await leaderBoards.updateLeaderBoardsData()
      await leaderBoards.requestSetLeaderBoards()
      await leaderBoards.awardBadges()
      consola.success('Leaderboards init: fetched and cached')
    } catch (err) {
      consola.error('Could not init leaderboards:', err)
    }

    setTimeout(leaderBoards.initialize, leaderBoardsRefreshTime * 60 * 1000)

    return true
    // })

    // this.updateLeaderBoardsData();
    // this.requestSetLeaderBoards();
  }

  static async setBadgeFieldIds() {
    // Fetch 1 member to get custom fields ID's
    const forumMembers = require('../../server/base/forumMembers')
    let forumFetch
    try {
      forumFetch = await forumMembers.getRandomForumMember()
    } catch (error) {
      throw Error('Failed fetching random member')
    }

    customFieldsIds = new Map()
    if (forumFetch && forumFetch.customFields) {
      // Get ID's of badges customFields
      const customFields = forumFetch.customFields
      for (const index in customFields) {
        const theFields = customFields[index]
        if (theFields.name === 'Badges') {
          // Map reward badges to ID
          for (const id in theFields.fields) {
            // Check if field name is present in badgeNames, then set id to name
            const theName = theFields.fields[id].name
            for (const n in badgeNames) {
              if (badgeNames[n] === theName) {
                customFieldsIds.set(n, {
                  id: parseInt(id, 10),
                  name: theName
                })
                break
              }
            }
          }
        }
      }
    }
    return true
  }

  /*
  Leaderboards
  Kills gamemodes: Display top kills (top 200)
  Timed gamemodes: Count top 10 toptimes. Each toptime rank gives different points, for example:
  Top 1: 10, Top 2: 9, Top 3: 8, Top 4: 7, Top 5: 6, Top 6: 5, Top 7: 4, Top 8: 3, Top 9: 2, Top 10: 1
  */

  static async updateLeaderBoardsData() {
    // If anyone got a better performing query, please share
    try {
      // Remove records
      await mtaServersDb.query('truncate leaderboards')
      // DD, SH, DL
      await mtaServersDb.query(
        'INSERT INTO leaderboards(forumid, sh, dd, dl) ' +
          'SELECT forumid TheID, ' +
          "(SELECT IFNULL(SUM(`value`), 0) FROM toptimes WHERE `racemode` = 'sh' AND pos < 11 AND `forumid`=TheID AND `value` IS NOT NULL), " +
          "(SELECT IFNULL(SUM(`value`), 0) FROM toptimes WHERE `racemode` = 'dd' AND pos < 11 AND `forumid`=TheID AND `value` IS NOT NULL), " +
          "(SELECT IFNULL(SUM(`value`), 0) FROM toptimes WHERE `racemode` = 'dl' AND pos < 11 AND `forumid`=TheID AND `value` IS NOT NULL) " +
          'FROM `toptimes` ' +
          'GROUP BY forumid ' +
          'ON DUPLICATE KEY UPDATE `sh`=VALUES(`sh`), `dd`=VALUES(`dd`), `dl`=VALUES(`dl`); '
      )
      // RACE, RTF, NTS
      for (const mode of ['race', 'rtf', 'nts']) {
        await mtaServersDb.query(
          'INSERT INTO leaderboards(forumid, ' + mode + ') ' +
            'SELECT `forumid` TheID, ' +
            "(SELECT COUNT(*)*10 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 1 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*9 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 2 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*8 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 3 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*7 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 4 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*6 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 5 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*5 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 6 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*4 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 7 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*3 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 8 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*)*2 FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 9 AND `forumid`=TheID)+ " +
            "(SELECT COUNT(*) FROM `toptimes` WHERE `racemode`='" + mode + "' AND pos = 10 AND `forumid`=TheID) as points " +
            'FROM `toptimes` ' +
            'GROUP BY `forumid` ' +
            'ON DUPLICATE KEY UPDATE `' + mode + '`=VALUES(' + mode + ');'
        )
      }

      // Donations
      await db.query(
        'INSERT INTO mrgreengaming_mtasrvs.leaderboards(forumid, donations) ' +
        'SELECT forum_id, ' +
        'Sum(amount) AS total ' +
        '    FROM   (SELECT forum_id, ' +
        '        amount ' +
        '    FROM   mrgreengaming_base.payments ' +
        '    UNION ALL ' +
        '    SELECT forum_id, ' +
        '        amount ' +
        '    FROM   mrgreengaming_gc.payments ' +
        '    UNION ALL ' +
        '    SELECT forum_id, ' +
        '        ( amount / 1000 ) ' +
        '    FROM   mrgreengaming_gc.donations_OLD) AS t ' +
        'GROUP  BY forum_id ' +
        'ON DUPLICATE KEY UPDATE `donations`=VALUES(total); '
      )

      // Greencoins
      await leaderBoards.fetchGreenCoinsRankings()
    } catch (error) {
      console.error(error)
      throw error
    }
    return true
  }

  static async fetchGreenCoinsRankings() {
    await db.query('SELECT `userId` forumid, `coinsBalance` points FROM `users` ORDER BY points DESC LIMIT ?', amountToFetch).catch((err) => {
      console.error(err)
      throw err
    }).then((res) => {
      greencoinsData = JSON.parse(JSON.stringify(res))
    })
    return true
  }

  static async requestSetLeaderBoards() {
    const dbReturn = {}
    for (const singleMode of leaderBoardModes.entries()) {
      try {
        const dbResults = await mtaServersDb.query(
          'SELECT `forumid` AS forumid, ?? AS points FROM leaderboards ORDER BY points DESC, forumid ASC LIMIT ?',
          [singleMode[0], amountToFetch]
        )
        if (dbResults && dbResults.length) {
          dbReturn[singleMode[0]] = JSON.parse(JSON.stringify(dbResults))
        }
      } catch (error) {
        console.error(error)
      }
    }
    // Greencoins
    dbReturn.greencoins = greencoinsData
    greencoinsData = []
    // Donations
    await mtaServersDb.query('SELECT `forumid`, donations AS points FROM leaderboards ORDER BY points DESC, forumid ASC LIMIT ?', amountToFetch).catch((err) => {
      throw Error(err.message)
    }).then((res) => {
      dbReturn.donations = JSON.parse(JSON.stringify(res))
    })

    // Prepare ID(s), push in array
    const ID = []

    for (const modeIndex in dbReturn) {
      for (const index in dbReturn[modeIndex]) {
        const playerID = parseInt(dbReturn[modeIndex][index].forumid, 10)
        ID.push(playerID)
      }
    }
    // console.log(ID);
    // Get forum member info
    const forumMembers = require('../../server/base/forumMembers')
    let forumFetch
    try {
      forumFetch = await forumMembers.getForumMember(ID, true)
    } catch (error) {
      // deny(1, error || "Failed fetching member");
      // return;
      // console.error("forumFe",error);
    }

    // Create map of returned forum members
    const memberInfo = new Map()
    for (const fetched of forumFetch) {
      if (fetched.id) {
        memberInfo.set(parseInt(fetched.id, 10), fetched)
      } else {
        // console.log("NO ID FOUND");
        // console.log(fetched);
      }
    }

    // Loop through the response, adding the additional member info api returns to dbReturn

    for (const mode in dbReturn) {
      // Add rankings
      let rank = 1
      for (const player in dbReturn[mode]) {
        const theID = parseInt(dbReturn[mode][player].forumid)
        const member = memberInfo.get(theID)
        if (member) {
          if (mode === 'donations') {
            await forumMembers.getMemberCustomField(theID, 30).catch((error) => {
              console.log(error.message)
            }).then((showName) => {
              if (showName) {
                dbReturn[mode][player].formattedName = member.formattedName
                dbReturn[mode][player].name = member.name
                dbReturn[mode][player].profileUrl = member.profileUrl
                dbReturn[mode][player].photoUrl = member.photoUrl
              }
            })
          } else {
            dbReturn[mode][player].formattedName = member.formattedName
            dbReturn[mode][player].name = member.name
            dbReturn[mode][player].profileUrl = member.profileUrl
            dbReturn[mode][player].photoUrl = member.photoUrl
          }
        }
        dbReturn[mode][player].rank = rank
        rank++
      }
    }
    leaderBoardsData = dbReturn
    return true
  }

  static async awardBadges() {
    // QUERY
    await leaderBoards.setBadgeFieldIds().catch((err) => {
      throw err
    })

    if (customFieldsIds.size !== leaderBoardModes.size) {
      // console.log('Award Badges: Field ID map empty or invalid length')
      throw Error('Award Badges: Field ID map empty or invalid length')
    }

    // Remove badges for all
    for (const [mode, v] of leaderBoardModes) {
      const fieldId = customFieldsIds.get(mode)
      if (!fieldId.id) {
        // console.log('Could not find field id for ' + mode, v)
        throw Error('Could not find field id for ' + mode + ' - ' + v)
      }
      const colName = 'field_' + fieldId.id
      const theQuery = 'UPDATE x_utf_l4g_core_pfields_content SET ?? = null WHERE ?? IS NOT NULL'
      try {
        await forumsDb.query(theQuery, [colName, colName])
      } catch (err) {
        throw err.message
      }
    }

    // Award new players
    for (const mode in leaderBoardsData) {
      if (customFieldsIds.get(mode)) {
        for (const row of leaderBoardsData[mode]) {
          if (row.rank <= playerTopAmountToReward) {
            // Award player with rank, then insert into db
            // Repalace ID in call
            const theModeId = parseInt(customFieldsIds.get(mode).id, 10)
            if (theModeId) {
              const colName = 'field_' + theModeId
              const theQuery = 'UPDATE x_utf_l4g_core_pfields_content SET ?? = ? WHERE `member_id` = ?'
              let executeQuery
              try {
                // console.log(row.forumid + ' - ' + mode + ' - ' + row.rank)
                // For some reason this doesnt work when anonymous
                executeQuery = await forumsDb.query(theQuery, [colName, row.rank, row.forumid])
              } catch (err) {
                console.log('Failed setting leaderboard badge for: ' + row.forumid, err)
              }
              if (!executeQuery.message) {
                console.log('Failed setting leaderboard badge for: ' + row.forumid, executeQuery)
              }
            }
          }
        }
      }
    }
    return true
  }

  static getItems() {
    return leaderBoardsData
  }
}

module.exports = leaderBoards
