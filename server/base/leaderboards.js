const consola = require('consola')
const leaderBoardsRefreshTime = 120 // Refresh every x minutes
let leaderBoardModes = {
  // Modes that should be prefetched
  nts: true,
  race: true,
  dd: true,
  dl: true,
  sh: true,
  total: true,
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
  rtf: 'Top RTF Badge',
  total: 'Top Total Player Badge'
}
let customFieldsIds = new Map()

// badgeNames = new Map(Object.entries(badgeNames));

const playerTopAmountToReward = 5 // Reward top 5 in each mode with a badge
const amountToFetch = 100 // Prefetch amount from each mode

let leaderBoardsData = []

class leaderBoards {
  /**
	 * Initialize
	 * @return {void}
	 */
  static initialize() {
    // Fetch leaderboards, if fail, retry
    return new Promise(async (resolve, reject) => {
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

      resolve()
    })

    // this.updateLeaderBoardsData();
    // this.requestSetLeaderBoards();
  }
  static setBadgeFieldIds() {
    return new Promise(async (resolve, reject) => {
      // Fetch 1 member to get custom fields ID's
      const forumMembers = require('../../server/base/forumMembers')
      let forumFetch
      try {
        forumFetch = await forumMembers.getRandomForumMember()
      } catch (error) {
        reject(Error('Failed fetching random member'))
        return
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
      resolve()
    })
  }

  static updateLeaderBoardsData() {
    return new Promise(async (resolve, reject) => {
      // If anyone got a better performing query, please share
      let gamemodesQuery
      // let donationQuery
      // let greencoinsQuery
      try {
        gamemodesQuery = await mtaServersDb.query(
          'INSERT INTO leaderboards (forumid, race, nts, dl, sh, rtf, dd, total)' +
						'SELECT `forumid` TheID,' +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='race' AND `forumid`=TheID)," +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='nts' AND `forumid`=TheID)," +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='dl' AND `forumid`=TheID)," +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='sh' AND `forumid`=TheID)," +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='rtf' AND `forumid`=TheID)," +
						"(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `racemode`='dd' AND `forumid`=TheID)," +
						'(SELECT COUNT(*) FROM `toptimes` WHERE `pos`<= 10 AND `forumid`=TheID AND `racemode` IS NOT NULL )' +
						'FROM `toptimes`' +
						'GROUP BY `forumid`' +
						'ON DUPLICATE KEY UPDATE `race`=VALUES(race), `nts`=VALUES(nts), `dl`=VALUES(dl), `sh`=VALUES(sh), `rtf`=VALUES(rtf), `dd`=VALUES(dd), `total`=VALUES(total);'
        )
        // donationQuery = await mtaServersDb
      } catch (error) {
        console.error(error)
        reject(error)
        return
      }
      resolve(gamemodesQuery)
    })
  }

  static requestSetLeaderBoards() {
    return new Promise(async (resolve, reject) => {
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
            dbReturn[mode][player].formattedName = member.formattedName
            dbReturn[mode][player].name = member.name
            dbReturn[mode][player].profileUrl = member.profileUrl
            dbReturn[mode][player].photoUrl = member.photoUrl
          }
          dbReturn[mode][player].rank = rank
          rank++
        }
      }
      leaderBoardsData = dbReturn
      resolve()
    })
  }

  static awardBadges() {
    // QUERY
    // INSERT INTO `leaderboards_awarded`(`forumid`, `mode`, `rank`, `awarded`) VALUES (101, "nts", 1, false);
    return new Promise(async (resolve, reject) => {
      try {
        await leaderBoards.setBadgeFieldIds()
      } catch (err) {
        console.log(err)
        resolve()
        return
      }

      if (customFieldsIds.size !== leaderBoardModes.size) {
        console.log('Award Badges: Field ID map empty or invalid length')
        resolve()
        return
      }

      // Remove badges for all
      for (const [mode, v] of leaderBoardModes) {
        const fieldId = customFieldsIds.get(mode)
        if (!fieldId.id) {
          console.log('Could not find field id for ' + mode, v)
          resolve()
          return
        }
        const colName = 'field_' + fieldId.id
        const theQuery = 'UPDATE x_utf_l4g_core_pfields_content SET ?? = null WHERE ?? IS NOT NULL'
        try {
          await forumsDb.query(theQuery, [colName, colName])
        } catch (err) {
          console.log(err)
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
      resolve()
    })
  }

  static getItems() {
    return leaderBoardsData
  }
}

module.exports = leaderBoards
