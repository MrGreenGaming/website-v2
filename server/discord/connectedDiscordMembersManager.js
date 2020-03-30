const Users = require('../base/users')
const leaderBoards = require('../../server/base/leaderboards')
const VipManager = require('../../server/base/vipManager')

let ipbLoginID
let connectedMembersByDiscordID = new Map()
let connectedMembersByForumID = new Map()
const refreshTime = 5 // in minutes

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
    connectedMembersByDiscordID = new Map()
    connectedMembersByForumID = new Map()
    const res = await forumsDb.query('SELECT `token_member` as forumID, `token_identifier` as discordID FROM `x_utf_l4g_core_login_links` WHERE `token_login_method` = ? AND `token_linked` = 1', [ipbLoginID])

    for (const row of res) {
      if (!row.forumID || !row.discordID) {
        continue
      }

      connectedMembersByDiscordID.set(row.discordID.toString(), row.forumID.toString())
      connectedMembersByForumID.set(row.forumID.toString(), row.discordID.toString())
    }
  }

  static async getAll() {
    const allMembers = []
    for (const row of connectedMembersByForumID) {
      try {
        const member = await this.getMemberInfo(row[0], row[1])
        allMembers.push(member)
      } catch {
        continue
      }
    }
    return allMembers
  }

  static async getMemberConnectedByDiscordID(id) {
    if (connectedMembersByDiscordID.has(id.toString())) {
      try {
        const member = await this.getMemberInfo(connectedMembersByDiscordID.get(id.toString()), id)
        return member
      } catch (err) {
        console.log(err)
        return false
      }
    } else {
      return false
    }
  }

  static async getMemberConnectedByForumID(id) {
    if (connectedMembersByForumID.has(id.toString())) {
      try {
        const member = await this.getMemberInfo(id, connectedMembersByForumID.get(id))
        return member
      } catch (err) {
        console.log(err)
        return false
      }
    } else {
      return false
    }
  }

  static async getMemberInfo(forumID, discordID) {
    const forumMember = await Users.get(parseInt(forumID, 10))
    const memberInfo = {
      forumID: forumID,
      discordID: discordID,
      name: forumMember.getName(),
      profileUrl: `https://mrgreengaming.com/forums/profile/${forumMember.getId()}-${forumMember.getName()}`,
      created: forumMember.getCreated(),
      coinsBalance: forumMember.getCoins().getBalance(),
      avatar: forumMember.getAvatar(),
      avatarThumb: forumMember.getAvatarThumb(),
      vip: VipManager.getVip(forumMember.getId()),
      banned: forumMember.getBanned()
    }
    // Get leaderboards rankings
    const memberRanks = {}
    const leaderBoardsItems = leaderBoards.getItems()
    for (const category in leaderBoardsItems) {
      for (const row of leaderBoardsItems[category]) {
        if (row.forumid === parseInt(forumID, 10)) {
          memberRanks[category] = {
            rank: row.rank,
            points: row.points
          }
          break
        }
      }
    }
    memberInfo.ranks = memberRanks

    return memberInfo
  }
}
module.exports = CustomDiscordMembersManager
