const sourceUserId = 19 // Send messages from this user (Mr. green)
const qs = require('qs')

class forumMessages {
  static sendMessage(target, title, body) {
    return new Promise(async (resolve, reject) => {
      if (
        !parseInt(target, 10) ||
				typeof title !== 'string' ||
				typeof body !== 'string'
      ) {
        reject(Error('Invalid arguments given.'))
      }
      const apiBaseUrl = global.Config.api.forums.apiBaseUrl
      const apiKey = global.Config.api.forums.apiKey
      const endpoint = '/messages/'
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      }
      const theCall = apiBaseUrl + endpoint + '?key=' + apiKey
      const theBody = {
        from: sourceUserId,
        to: [target],
        title: title,
        body: body
      }

      try {
        await axios.post(theCall, qs.stringify(theBody), config)
      } catch (err) {
        console.error(err)
        reject(Error('Could not send message: ' + err.message || ''))
        return
      }
      resolve()
    })
  }
}

module.exports = forumMessages
