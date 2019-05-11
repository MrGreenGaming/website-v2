const Gamedig = require('gamedig')

const gameserverRefreshTime = 1 // Get info every x minute(s)

const gameServers = [
  {
    name: 'mix',
    type: 'mtasa',
    host: '5.2.65.6',
    port: '22003'
  },
  {
    name: 'race',
    type: 'mtasa',
    host: '5.2.65.5',
    port: '22003'
  }
]
const gameServerInfo = new Map()

class gameserversManager {
  /**
	 * Initialize
	 * @return {void}
	 */
  static initialize() {
    // Get gameserver info
    return new Promise(async (resolve, reject) => {
      await gameserversManager.fetchServers().catch((err) => {
        console.error('gameserversManager', err)
      })

      setTimeout(
        gameserversManager.initialize,
        gameserverRefreshTime * 60 * 1000
      )
      resolve()
    })
  }

  static fetchServers() {
    return new Promise(async (resolve, reject) => {
      for (const server of gameServers) {
        await Gamedig.query({
          type: server.type,
          host: server.host,
          port: server.port
        })
          .then((state) => {
            gameServerInfo.set(server.name, state)
          })
          .catch((err) => {
            console.error('Failed fetching gameserver:', err)
          })
      }
      resolve()
    })
  }

  static getServerInfo(server) {
    if (!server || typeof server !== 'string') return false

    const theServer = gameServerInfo.get(server)
    return theServer || false
  }
}

module.exports = gameserversManager
