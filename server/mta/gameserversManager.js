const Gamedig = require('gamedig')

const gameserverRefreshTime = 1 // Get info every x minute(s)

const gameServers = [
  {
    name: 'mix',
    type: 'mtasa',
    host: 'racemix.mrgreengaming.com',
    port: '22003'
  },
  {
    name: 'race',
    type: 'mtasa',
    host: 'race.mrgreengaming.com',
    port: '22003'
  },
  {
    name: 'mcsmp',
    type: 'minecraft',
    host: 'mc.mrgreengaming.com',
    port: '25565'
  },
  {
    name: 'discord',
    type: 'discord',
    guildId: '228439442069651456'
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
        let srv = {}
        if (server.type !== 'discord') {
          srv = {
            type: server.type,
            host: server.host,
            port: server.port
          }
        } else {
          srv = {
            type: server.type,
            guildId: server.guildId
          }
        }

        await Gamedig.query(srv)
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
