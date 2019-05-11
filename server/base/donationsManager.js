// This file fetches/caches the donation list
const donationRefreshTime = 5 // Refresh every x minutes
const NodeCache = require('node-cache')
const ForumMembers = require('../base/forumMembers')
let monthDonations = []

// Short cache for member anon settings
const memberAnonSettingsCache = new NodeCache({ stdTTL: 60 })
class donationManager {
  /**
	 * Initialize
	 * @return {void}
	 */
  static initialize() {
    // Fetch monthly donation
    return new Promise(async (resolve, reject) => {
      const currentMonth = new Date().getMonth() + 1
      let fetchedDonos
      let fetchDb
      try {
        fetchDb = await db.query(
          'SELECT * FROM `payments` WHERE MONTH(`date`) = ? ORDER BY `date` DESC',
          currentMonth
        )
      } catch (err) {
        console.error('Donations. problem fetching:', err)
      }
      if (fetchDb && fetchDb.length > 0) {
        fetchedDonos = []
        for (const row of fetchDb) {
          if (row.amount && row.date && row.forum_id) {
            const isCached = memberAnonSettingsCache.get(row.forum_id)
            if (isCached) {
              // Member setting is cached, adjust amount and date
              isCached.date = row.date
              isCached.amount = row.amount
              fetchedDonos.push(isCached)
            } else {
              // Check if member donation is set to anonymous
              let showName = false
              try {
                showName = await ForumMembers.getMemberCustomField(parseInt(row.forum_id, 10), 30)
              } catch (err) {
                console.error('Donation anonymity check error:', err)
              }
              // The custom field returns 0 for false, and 1 for true
              let insertRow
              if (!showName || parseInt(showName.value) === 1 || !showName.member) {
                insertRow = {
                  name: 'Anonymous',
                  amount: row.amount,
                  date: row.date
                }
              } else {
                insertRow = {
                  name: showName.member.name || 'Anonymous',
                  formattedname: showName.member.formattedName || false,
                  id: showName.member.id || false,
                  url: showName.member.profileUrl || false,
                  amount: row.amount,
                  date: row.date
                }
              }
              memberAnonSettingsCache.set(showName.member.id, insertRow)
              fetchedDonos.push(insertRow)
            }
          }
        }

        if (fetchedDonos) {
          monthDonations = fetchedDonos
        } else {
          monthDonations = []
        }
      }
      setTimeout(donationManager.initialize, donationRefreshTime * 60 * 1000)
      resolve()
    })
  }

  static getMonthlyDonations() {
    return monthDonations || []
  }
}

module.exports = donationManager
