const Users = require('../base/users')
const VipManager = require('../base/vipManager')
let ipbLoginID
let connectedMembersByDiscordID = new Map()
let connectedMembersByForumID = new Map()
const refreshTime = 10 // in minutes

class CustomDiscordMembersManager {
  static async initialize() {
    try {
      // Fetch connected members
      if (!ipbLoginID) {
        await CustomDiscordMembersManager.fetchLoginID()
      }
      await CustomDiscordMembersManager.fetchAll()

      setTimeout(
        CustomDiscordMembersManager.initialize,
        refreshTime * 60 * 1000
      )
    } catch (err) {
      console.error(err)
    }
  }

  static async fetchLoginID() {
    const res = await forumsDb.query("SELECT `login_id` FROM `x_utf_l4g_core_login_methods` WHERE `login_classname` LIKE '%discordapp%'")
    if (res && res[0] && res[0].login_id) {
      ipbLoginID = res[0].login_id
    }
  }

  static async fetchAll() {
    if (!ipbLoginID) {
      throw new Error('ipbLoginID is not available')
    }
    const res = await forumsDb.query('SELECT `token_member` as forumID, `token_identifier` as discordID FROM `x_utf_l4g_core_login_links` WHERE `token_login_method` = ? AND `token_linked` = 1', [ipbLoginID])

    connectedMembersByDiscordID = new Map()
    connectedMembersByForumID = new Map()
    for (const row of res) {
      if (!row.forumID || !row.discordID) {
        continue
      }
      const forumMember = await Users.get(row.forumID).catch((e) => { console.error(e) })
      const vipInfo = VipManager.getVip(row.forumID)
      const val = {
        forumID: row.forumID,
        discordID: row.discordID,
        greencoins: (forumMember) ? forumMember.coins.balance : 0,
        vip: vipInfo || false,
        forumBanned: (forumMember) ? forumMember.banned : false,
        forumName: (forumMember) ? forumMember.name : ''

      }
      connectedMembersByDiscordID.set(row.discordID.toString(), val)
      connectedMembersByForumID.set(row.forumID.toString(), val)
    }
  }

  static getAll() {
    const allMembers = []
    for (const row of connectedMembersByDiscordID) {
      allMembers.push(row[1])
    }
    return allMembers
  }

  static getMemberConnectedByDiscordID(id) {
    return connectedMembersByDiscordID.has(id.toString()) ? connectedMembersByDiscordID.get(id.toString()) : false
  }

  static getMemberConnectedByForumID(id) {
    return connectedMembersByForumID.has(id.toString()) ? connectedMembersByForumID.get(id.toString()) : false
  }
}
module.exports = CustomDiscordMembersManager
