const express = require('express')
const consola = require('consola')
const { Builder } = require('nuxt')
const { Nuxt } = require('nuxt-start')
const app = express()

consola.ready('base URL: ', process.env.API_URL)
// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

function initConfig() {
  // const _ = require("lodash");
  const envModule = '../config/env.json'
  delete require.cache[require.resolve(envModule)]
  const env = require(envModule)

  global.Config = env.base
  setTimeout(() => {
    consola.info('Reloading server configuration')
    initConfig()
  }, (Config.configReloadTimeSeconds || 900) * 1000)
}

// TODO: ERROR HANDLING WHEN NO DB CONNECTION
function initDB() {
  // Init databases
  return new Promise(async (resolve, reject) => {
    const Database = require('../server/base/database')
    const socket = ''
    let dbConfig = Config.databases.base
    global.db = new Database(
      socket,
      dbConfig.host,
      dbConfig.port,
      dbConfig.user,
      dbConfig.password,
      dbConfig.databaseName,
      dbConfig.connectionLimit
    )

    dbConfig = Config.databases.forums
    global.forumsDb = new Database(
      socket,
      dbConfig.host,
      dbConfig.port,
      dbConfig.user,
      dbConfig.password,
      dbConfig.databaseName,
      dbConfig.connectionLimit
    )
    dbConfig = Config.databases.mtaservers
    global.mtaServersDb = new Database(
      socket,
      dbConfig.host,
      dbConfig.port,
      dbConfig.user,
      dbConfig.password,
      dbConfig.databaseName,
      dbConfig.connectionLimit
    )

    try {
      await db.connect()
      await forumsDb.connect()
      await mtaServersDb.connect()
    } catch (error) {
      // console.log("");
      reject(error)
      return
    }

    resolve()
  })
}
function initModules() {
  return new Promise(async (resolve, reject) => {
    const Leaderboards = require('../server/base/leaderboards')
    const SettingsManager = require('../server/base/settings')
    const GameserversManager = require('../server/mta/gameserversManager')
    const VipManager = require('../server/base/vipManager')
    const DonationManager = require('../server/base/donationsManager')
    const MapUploads = require('../server/mta/mapUploads')
    // Set globals
    global.Utils = require('../utils/utils')
    global.ApiApps = require('../server/base/apiApps')
    global.Users = require('../server/base/users')
    global.axios = require('axios')
    try {
      await initCaching()
      await ApiApps.load()
      await SettingsManager.initialize()
      await VipManager.initialize()
      await DonationManager.initialize()
      // await Games.load()
      Leaderboards.initialize()
      await GameserversManager.initialize()
      await MapUploads.init()
    } catch (err) {
      console.error('initModules ERROR: ', err)
      reject(err)
      return
    }
    resolve()
  })
}
function initCaching() {
  const NodeCache = require('node-cache')
  // Forum member cache (api/core/members/{id})
  global.forumMemberCache = new NodeCache({ stdTTL: 10800 })
  if (global.forumMemberCache) {
    consola.info('forumMemberCache succesfully init')
  }
}

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)
  await nuxt.ready()

  const {
    host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000
  } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Init
  try {
    await initConfig()
    await initDB()
    await initModules()
  } catch (err) {
    console.error('INIT error.', err)
    process.exit(1)
  }

  // Listen the server
  app.listen(port, host)
  consola.ready('#############################')
  consola.ready('Mr. Green Gaming website')
  consola.ready('#############################')
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
