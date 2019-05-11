/** @type {Map<number, ApiApp>} */
const cachedApiApps = new Map()

const reloadTime = 600

class ApiApps {
  /**
	 * Load API Apps
	 * @return {Promise<void>}
	 */
  static load() {
    return new Promise(async (resolve, reject) => {
      console.debug('Loading API apps')

      let dbApiApps
      try {
        dbApiApps = await db.query(
          `SELECT \`appId\`, \`name\`, \`secretHash\` FROM \`apiApps\` WHERE \`active\` = 1`
        )
      } catch (error) {
        reject(error)
        return
      }

      const removeApiAppIds = new Set(cachedApiApps.keys())

      for (const dbApiApp of dbApiApps) {
        const apiAppId = dbApiApp.appId

        let apiApp
        if (cachedApiApps.has(apiAppId)) {
          // Cache hit, use existing
          removeApiAppIds.delete(apiAppId) // Remove from removal list
          apiApp = cachedApiApps.get(apiAppId)
        } else {
          // Cache miss, create new
          const ApiApp = require('../classes/apiApp')
          apiApp = new ApiApp(dbApiApp.appId)
          cachedApiApps.set(apiApp.getId(), apiApp)
        }
        apiApp.parseDb(dbApiApp)
      }

      // Remove apps that are no longer in the database
      for (const appApiId of removeApiAppIds) {
        cachedApiApps.delete(appApiId)
      }

      console.info(
        `Loaded ${cachedApiApps.size} and removed ${
          removeApiAppIds.size
        } API Apps`
      )

      // Next reload
      setTimeout(async () => {
        try {
          await this.load()
        } catch (error) {
          console.error(error)
        }
      }, reloadTime * 1000)

      resolve()
    })
  }

  /**
	 * Get API app by id
	 * @param {number} id
	 * @return {ApiApp|void} apiApp
	 */
  static get(id) {
    if (id) return cachedApiApps.get(id)
  }

  /**
	 * Get all API apps
	 * @return {Set<ApiApp>} apiApps
	 */
  static getAll() {
    return new Set(cachedApiApps.values())
  }
}

module.exports = ApiApps
