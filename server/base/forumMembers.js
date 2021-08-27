const useRestAPI = false // Forum member fetching used to happen with the official IPB Rest API, but it seems slow, so database fetching it is!

const axios = require('axios')
class forumMembers {
  static getRandomForumMember() {
    // Fetches 1 forum member of the lowest forumid found
    // Used to check fields or other names, so this should not be cached
    return new Promise(async (resolve, reject) => {
      const apiBaseUrl = global.Config.api.forums.apiBaseUrl
      const apiKey = global.Config.api.forums.apiKey
      const endpoint = 'members/'
      const theCall =
				apiBaseUrl + endpoint + '?key=' + apiKey + '&page=1&perPage=1'

      await axios
        .get(theCall)
        .then((res) => {
          if (res.data && res.data.results && res.data.results[0]) {
            resolve(res.data.results[0])
          } else {
            reject(new Error('Problem fetching random forumMember'))
          }
        })
        .catch((err) => {
          // error
          console.error(err)
          reject(err)
        })
    })
  }

  static getMemberCustomField(id, customFieldId) {
    return new Promise(async (resolve, reject) => {
      if (!id || !parseInt(id, 10) || !customFieldId || !parseInt(customFieldId)) {
        reject(Error('Wrong syntax.'))
        return
      }
      customFieldId = parseInt(customFieldId)
      if (useRestAPI) {
        const apiBaseUrl = global.Config.api.forums.apiBaseUrl
        const apiKey = global.Config.api.forums.apiKey
        const endpoint = 'members/'

        // Get forum member via api
        const query = apiBaseUrl + endpoint + id + '?key=' + apiKey
        let fetchedMember
        try {
          fetchedMember = await axios.get(query)
        } catch (err) {
          reject(Error(err))
          return
        }
        if (fetchedMember && fetchedMember.data && fetchedMember.data.customFields) {
          const customFields = fetchedMember.data.customFields
          for (const catId in customFields) {
            const category = customFields[catId]
            for (const rowNum in customFields[catId]) {
              const theFields = category[rowNum]
              for (const fieldId in theFields) {
                if (parseInt(fieldId, 10) === customFieldId) {
                // If found, resolve field value and member details
                // Return member details so no refetch is necessary
                  const resolveVal = {
                    value: theFields[fieldId].value || false,
                    member: fetchedMember.data
                  }
                  resolve(resolveVal)
                  return
                }
              }
            }
          }
          reject(Error('Could not find custom field'))
        } else {
          reject(Error('Could not fetch member'))
        }
      } else {
        let getMember
        try {
          getMember = await forumMembers.getForumMember(id, false, true)
        } catch (err) {
          console.error(err)
          reject(err)
          return
        }
        if (!getMember || getMember.length === 0) {
          reject(Error('Could not fetch member for custom fields'))
          return
        }
        let valueFound = false
        let customFieldValue
        for (const k in getMember[0].customFields) {
          // Search for custom fields, then compare to requested id

          if (parseInt(k) === customFieldId) {
            // Found it, return value
            valueFound = true
            customFieldValue = getMember[0].customFields[k]
            break
          }
        }
        if (!valueFound) {
          reject(Error('Could not find custom field ID from member'))
        } else {
          const resolveVal = {
            value: customFieldValue || false,
            member: getMember[0]
          }
          resolve(resolveVal)
        }
      }
    })
  }

  static getForumMember(id, returnIfNotExists, noCache) {
    return new Promise(async (resolve, reject) => {
      const apiBaseUrl = global.Config.api.forums.apiBaseUrl
      const apiKey = global.Config.api.forums.apiKey
      const endpoint = 'members/'
      const cache = global.forumMemberCache

      let hasError = false
      // Check argument, convert to array if needed
      const request = []
      if (!id) {
        // eslint-disable-next-line
				reject("No id(s) provided");
        return
      } else if (!isNaN(id)) {
        // Push valid id to request
        request.push(parseInt(id, 10))
      } else if (Array.isArray(id)) {
        // Check if array values are valid
        let argError = false
        for (const i in id) {
          const val = id[i]
          if (!isNaN(val)) {
            // Valid number, convert with parseInt
            // id[i] = parseInt(val, 10);
            request.push(parseInt(val, 10))
          } else {
            argError = true
            break
          }
        }
        if (argError) {
          // Reject if values aren't numbers

          reject(Error('Argument must be either number or array'))
          return
        }
      } else {
        reject(Error('Argument must be either number or array'))
        return
      }
      if (useRestAPI) {
        const idMap = new Map()
        const axiosAllCalls = []
        const axiosAllCallsChunks = []
        // Check cache, make up axios calls
        for (const theId of request) {
        // Check if member ID is already handled
          if (!idMap.get(theId)) {
            const memberInfo = cache.get(theId)
            if (memberInfo) {
            // Member is in cache
              idMap.set(theId, memberInfo)
            } else {
            // Not cached, add to axios call array
              const theCall = apiBaseUrl + endpoint + theId + '?key=' + apiKey
              axiosAllCalls.push(theCall)
            }
          }
        }

        // Make axios calls
        if (axiosAllCalls.length > 0) {
        // Split calls to avoid 508 resource limit error
          const maxCallsAmount = 35
          while (axiosAllCalls.length) {
            axiosAllCallsChunks.push(axiosAllCalls.splice(0, maxCallsAmount))
          }

          const delay = require('delay')

          // AXIOS ALL METHOD
          for (const urls of axiosAllCallsChunks) {
            await axios
              .all(urls.map(url => axios.get(url).catch(err => err)))
              .then((res) => {
              // Loop trough the response, cache and map to ID

                for (const data of res) {
                // Error handling
                  if ('response' in data && 'data' in data.response) {
                  // Is error
                    const returnedError = data.response.data
                    if (typeof returnedError === 'string') {
                    // (body) error
                      hasError = returnedError
                    } else if (returnedError.errorMessage) {
                    // API error
                    // Check if error is "INVALID_ID", determine next based on returnIfNotExists
                      hasError = returnedError.errorMessage

                      if (returnIfNotExists && hasError === 'INVALID_ID') {
                        hasError = false
                      }
                    } else {
                      hasError = 'Problem fetching member(s)'
                      console.error(hasError)
                    }

                    continue
                  }

                  // Data handling
                  const memberVal = data.data

                  if (memberVal.id) {
                  // Cache member
                    cache.set(parseInt(memberVal.id), memberVal, function (
                      err,
                      succ
                    ) {
                      if (!err && succ) {
                      // consola.info(
                      // 	"Cached forum member " +
                      // 		memberVal.id +
                      // 		" (forumMembers.js)"
                      // );
                      }
                    })
                    // map ID to data
                    idMap.set(parseInt(memberVal.id, 10), memberVal)
                  }
                }
              })
            // await delay HERE, avoid 508 resource limit
            // Check if not at last element of array
            if (urls !== axiosAllCallsChunks[axiosAllCallsChunks.length - 1]) {
              await delay(100)
            }
          }
        }
        // Reject on error
        if (hasError) {
        // eslint-disable-next-line
				reject(new Error("Failed fetching forum member(S)"));
          return
        }

        // Make return array
        // console.log(request);

        const returnArray = []
        for (const value of request) {
        // console.log(value);
          const mem = idMap.get(value)
          if (mem) {
            returnArray.push(mem)
          } else if (returnIfNotExists) {
          // One or more members couldnt be fetched, so return an empty object
            returnArray.push({ id: value })
          } else {
          // If member not found in return, reject

            reject(Error('Something went wrong while fetching members: ' + value))
            return
          }
        }
        // Resolve/reject
        resolve(returnArray)
      } else {
        // Use Database fetching
        const idMap = new Map()
        // const dbQuery = []

        // Check cache
        for (const theId of request) {
        // Check if member ID is already handled
          if (!idMap.get(theId)) {
            const memberInfo = cache.get(theId)
            if (memberInfo && !noCache) {
            // Member is in cache
              idMap.set(theId, memberInfo)
            } else {
            // Not cached, add to axios call array
              const theCall = 'SELECT a.member_id AS id, a.name, a.members_seo_name, a.member_title AS title, a.pp_thumb_photo AS thumbnail, a.member_group_id AS "group", a.email, b.prefix, b.suffix, c.* FROM `x_utf_l4g_core_members` a LEFT JOIN `x_utf_l4g_core_groups` b ON b.g_id = a.member_group_id LEFT JOIN `x_utf_l4g_core_pfields_content` c ON c.member_id = a.member_id WHERE a.member_id = ?'
              let dbFetch
              try {
                dbFetch = await forumsDb.query(theCall, theId)
              } catch (err) {
                console.log(err)
                break
              }
              // console.log(dbFetch)
              if (!dbFetch || dbFetch.length === 0) {
                // Member not found, should handle
                // console.log('Error, member not found: ' + theId)
              } else {
                const fetchedMember = forumMembers.formatForumMemberFromDb(dbFetch[0])
                // Add to cache
                idMap.set(theId, fetchedMember)
              }
            }
          }
        }

        // Make return array
        const returnArray = []
        for (const value of request) {
        // console.log(value);
          const mem = idMap.get(value)
          if (mem) {
            returnArray.push(mem)
          } else if (returnIfNotExists) {
          // One or more members couldnt be fetched, so return an empty object
            returnArray.push({ id: value })
          } else {
          // If member not found in return, reject

            reject(Error('Something went wrong while fetching members: ' + value))
            return
          }
        }
        // Resolve/reject
        resolve(returnArray)
      }
    })
  }

  static formatForumMemberFromDb(val) {
    // default avatar
    // data:image\/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201024%201024%22%20style%3D%22background%3A%23c46f62%22%3E%3Cg%3E%3Ctext%20text-anchor%3D%22middle%22%20dy%3D%22.35em%22%20x%3D%22512%22%20y%3D%22512%22%20fill%3D%22%23ffffff%22%20font-size%3D%22700%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%3EC%3C%2Ftext%3E%3 LETTER HERE %2Fg%3E%3C%2Fsvg%3E
    // Avatar path: https://mrgreengaming.com/forums/uploads/

    // Mimick what the rest api would return
    // console.log(val)
    const imagePath = 'https://forums.mrgreengaming.com/uploads/'
    const memberObj = {}
    memberObj.id = val.id || false
    memberObj.name = val.name || false
    // eslint-disable-next-line no-mixed-operators
    memberObj.formattedName = val.prefix && val.suffix && val.prefix + val.name + val.suffix || false
    memberObj.primaryGroup = {
      id: val.group
    }
    memberObj.email = val.email
    if (val.thumbnail) {
      memberObj.photoUrl = val.thumbnail && imagePath + val.thumbnail
    } else {
      memberObj.photoUrl = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201024%201024%22%20style%3D%22background%3A%23c46f62%22%3E%3Cg%3E%3Ctext%20text-anchor%3D%22middle%22%20dy%3D%22.35em%22%20x%3D%22512%22%20y%3D%22512%22%20fill%3D%22%23ffffff%22%20font-size%3D%22700%22%20font-family%3D%22-apple-system%2C%20BlinkMacSystemFont%2C%20Roboto%2C%20Helvetica%2C%20Arial%2C%20sans-serif%22%3EC%3C%2Ftext%3E%3' + val.name.charAt(0) + '%2Fg%3E%3C%2Fsvg%3E'
    }
    memberObj.title = val.title
    memberObj.customFields = {}
    for (const k in val) {
      if (k.indexOf('field_') === 0) {
        const fieldId = parseInt(k.replace('field_', ''), 10)
        if (fieldId) {
          memberObj.customFields[fieldId] = val[k] || false
        }
      }
    }
    memberObj.profileUrl = 'https://forums.mrgreengaming.com/profile/' + val.id + '-' + val.members_seo_name + '/'

    return memberObj
  }
}
// forumMembers.initialize();

module.exports = forumMembers
