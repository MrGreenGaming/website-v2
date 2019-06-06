const consola = require('consola')
const vipRefreshTime = 60 // Refresh every x minutes
const moment = require('moment')
const fse = require('fs-extra')
const hornPath = 'clientUploads/vipHorns/'
// const Nu = moment()
// const Daarna = moment(Nu).add(100, 'd')
// const laatste = moment(Daarna).add(100, 'd')
// console.log(laatste)

let vip = new Map()
class vipManager {
  /**
	 * Initialize
	 * @return {void}
	 */
  static initialize() {
    // Fetch leaderboards, if fail, retry
    return new Promise(async (resolve, reject) => {
      vip = new Map()
      let fetchDb
      const expired = []
      try {
        fetchDb = await db.query('SELECT * FROM `vip`')
      } catch (err) {
        consola.error('Could not fetch vip', err)
      }
      if (fetchDb && fetchDb.length > 0) {
        const nowDate = moment()
        for (const row of fetchDb) {
          // Check if expired
          // const vipDate = new Date(row.ending_time * 1000)
          const vipDate = moment.unix(row.ending_time)
          if (!vipDate || vipDate < nowDate) {
            // Vip expired, add to remove arr
            expired.push(row.forumid)
          } else {
            // Not expired
            vip.set(row.forumid, row.ending_time)
          }
        }

        // Set null for all expired vip's from db
        for (const id of expired) {
          if (!parseInt(id, 10)) break
          // We put ending_time as null instead of deleting
          // db.query("DELETE FROM `vip` WHERE `forumid` = ?", id);
          db.query(
            'INSERT INTO `vip`(`forumid`, `ending_time`) VALUES (?,?) ON DUPLICATE KEY UPDATE `ending_time` = ?',
            [id, null, null]
          )
        }
        // Set VIP forum badges
        vipManager.handleVipBadges()
      }
      setTimeout(vipManager.initialize, vipRefreshTime * 60 * 1000)
      consola.success('Vip manager fetched and refreshed')
      resolve()
    })
  }
  static handleVipBadges() {
    return new Promise(async (resolve, reject) => {
      const forumBadgeId = 31
      const colName = 'field_' + forumBadgeId

      // First remove all VIP badges
      const theQuery = 'UPDATE x_utf_l4g_core_pfields_content SET ?? = null WHERE ?? IS NOT NULL'
      try {
        await forumsDb.query(theQuery, [colName, colName])
      } catch (err) {
        console.log(err)
        reject(err)
        return
      }
      // Add VIP badges to current VIP
      for (const [forumid, time] of vip) {
        const addBadgeQuery = 'UPDATE x_utf_l4g_core_pfields_content SET ?? = ? WHERE `member_id` = ?'
        let executeQuery
        try {
          // For some reason this doesnt work when anonymous
          executeQuery = await forumsDb.query(addBadgeQuery, [colName, 'VIP Player', forumid])
        } catch (err) {
          console.log('Failed setting leaderboard badge for: ' + forumid + ', VIP time: ' + time, err)
        }
        if (!executeQuery.message) {
          console.log('Failed setting leaderboard badge for: ' + forumid, executeQuery)
        }
      }
      resolve()
    })
  }
  static addVip(id, days, message) {
    return new Promise(async (resolve, reject) => {
      days = parseInt(days, 10)
      if (!days) {
        reject(Error('No days or days invalid'))
        return
      }
      days = Math.ceil(days)
      // Check if user already has VIP
      let fromDate = moment.unix(vip.get(id))
      const nowDate = moment()
      if (!fromDate.isValid() || fromDate < nowDate) {
        // If date is not valid or expired, set fromDate to now
        fromDate = nowDate
      }

      // Calculate new vip
      let newVipDate = moment(fromDate)
      newVipDate.add(days, 'd')

      // Check if vip needs to be removed (passed negative number & is now expired)
      if (newVipDate < nowDate) {
        // Remove vip from db
        try {
          // await db.query('DELETE FROM `vip` WHERE `forumid` = ?', id)
          await db.query(
            'INSERT INTO `vip`(`forumid`, `ending_time`) VALUES (?,?) ON DUPLICATE KEY UPDATE `ending_time` = ?',
            [id, null, null]
          )
        } catch (err) {
          reject(Error('Could not remove VIP from database for id #' + id))
          return
        }
        vip.delete(id)
        consola.info('VIP', 'Removed ' + days + ' days of VIP for ' + id)
      } else {
        // Add new vip to db
        newVipDate = moment(newVipDate).unix()
        try {
          // await db.query("");
          await db.query(
            'INSERT INTO `vip`(`forumid`, `ending_time`) VALUES (?,?) ON DUPLICATE KEY UPDATE `ending_time` = ?',
            [id, newVipDate, newVipDate]
          )
          vip.set(id, newVipDate)
          consola.info('VIP', 'Added ' + days + ' days of VIP for ' + id)
        } catch (err) {
          reject(Error('Could not add VIP to database for id #' + id))
          return
        }
      }
      resolve()
    })
  }

  static getVip(id) {
    return vip.get(id) || false
  }

  // Get VIP horns
  static getMemberHorns(forumid) {
    return new Promise(async (resolve, reject) => {
      await mtaServersDb.query('SELECT * FROM `vip_horns` WHERE `forumid` = ?', forumid).then((res) => {
        resolve(res)
      }).catch((err) => {
        reject(err)
      })
    })
  }
  // Delete VIP horn
  static removeMemberHorn(forumid, hornid) {
    if (typeof forumid !== 'number' || typeof hornid !== 'number') return
    // Delete from DB
    mtaServersDb.query('DELETE FROM `vip_horns` WHERE forumid = ? AND hornid = ?', [forumid, hornid]).catch((err) => {
      console.error('vip horn delete: ', err)
    })
    // Delete file
    const hornName = forumid + '-' + hornid + '.mp3'
    fse.remove(hornPath + hornName).catch((err) => {
      console.error('vip horn delete: ', err)
    })
  }
}

module.exports = vipManager
