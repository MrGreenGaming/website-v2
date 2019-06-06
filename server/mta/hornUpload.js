const fse = require('fs-extra')
const getMP3Duration = require('get-mp3-duration')
const VipManager = require('../base/vipManager')

const vipHornPath = 'clientUploads/vipHorns/'
const maxVipHorns = 5
const maxVipHornsDuration = 10 // Seconds

class hornUploads {
  static uploadVipHorn(forumid, file) {
    return new Promise(async (resolve, reject) => {
      // Check if the user is VIP
      if (!VipManager.getVip(forumid)) {
        reject(Error('You are not VIP. If you are, please re-log in to the website.'))
        return
      }

      let userVipHorns
      try {
        userVipHorns = await VipManager.getMemberHorns(forumid)
      } catch (err) {
        console.error(err)
        reject(Error('Could not fetch VIP horns. Please try again.'))
        return
      }

      if (Object.keys(userVipHorns).length >= maxVipHorns) {
        reject(Error('You have the maximum (' + maxVipHorns + ') amount of VIP horns. Remove one before uploading.'))
        return
      }

      // Get free hornid
      const idMap = new Map()
      let hornid
      for (const row of userVipHorns) {
        idMap.set(row.hornid, true)
      }
      for (let i = 1; i < maxVipHorns + 1; i++) {
        if (!idMap.get(i)) {
          hornid = i
          break
        }
      }
      if (!hornid) {
        reject(Error('Could not get a free horn id, please try again.'))
        return
      }

      // Revalidate horn length
      let buffer = await fse.readFile(file.path).catch((err) => {
        console.error(err)
        buffer = false
      })
      if (!buffer) {
        reject(Error('Could not read the .mp3 file. Please be sure its valid'))
        return
      }
      const duration = getMP3Duration(buffer)

      if (!duration || typeof duration !== 'number') {
        reject(Error('Could not read the .mp3 file. Please make sure its valid'))
        return
      } else if (duration / 1000 > maxVipHornsDuration) {
        reject(Error('Your horn is longer than is allowed. Please reduce its duration to max: ' + maxVipHornsDuration + ' seconds'))
        return
      }
      // Copy file
      await fse.copy(file.path, vipHornPath + forumid + '-' + hornid + '.mp3', { overwrite: true }).catch((err) => {
        console.error(err)
        reject(Error('Could not copy mp3 file, please check if the file is valid.'))
      })
      // Insert into db
      try {
        await mtaServersDb.query('INSERT INTO `vip_horns`(`forumid`, `hornid`, `name`, `size`, duration) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE `name` = ?, `size` = ?, `duration` = ?',
          [forumid, hornid, file.originalname || null, file.size || null, duration || null, file.originalname || null, file.size || null, duration || null])
      } catch (err) {
        console.log(err)
        await fse.remove(vipHornPath + forumid + '-' + hornid + '.mp3')
        reject(Error('Could not connect to database'))
        return
      }

      // Uploaded return
      resolve()
    })
  }
}

module.exports = hornUploads
