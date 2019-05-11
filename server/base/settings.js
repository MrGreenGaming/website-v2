const consola = require('consola')
const settingsRefreshTime = 60 // Refresh every x minutes
let settings = new Map()
class settingsManager {
  /**
	 * Initialize
	 * @return {void}
	 */
  static initialize() {
    // Fetch leaderboards, if fail, retry
    return new Promise(async (resolve, reject) => {
      settings = new Map()
      let fetchDb
      try {
        fetchDb = await db.query('SELECT * FROM `website_settings`')
      } catch (err) {
        consola.error('Can not fetch settings', err)
      }
      if (fetchDb && fetchDb.length > 0) {
        for (const row of fetchDb) {
          settings.set(row.setting_name, row.setting_value)
        }
      }
      setTimeout(settingsManager.initialize, settingsRefreshTime * 60 * 1000)
      consola.success('Website settings fetched and refreshed')
      resolve()
    })
  }

  static getSetting(name) {
    return settings.get(name) || false
  }

  static setSetting(name, value) {
    return new Promise(async (resolve, reject) => {
      try {
        await db.query(
          'INSERT INTO `website_settings`(`setting_name`, `setting_value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `setting_value` = ?',
          [name, value, value]
        )
      } catch (err) {
        consola.error('Failed saving setting to db', err)
        reject(err)
        return
      }
      settings.set(name, value)
      resolve()
    })
  }
}

module.exports = settingsManager
