class ApiApp {
  /**
	 * Construct API App
	 * @param {number} id
	 */
  constructor(id) {
    /** @private */
    this.id = id

    /** @private */
    this.name = undefined

    /** @private */
    this.secretHash = undefined
  }

  /**
	 * Get API App id
	 * @return {number}
	 */
  getId() {
    return this.id
  }

  /**
	 * Get secret hash
	 * @return {string|void} secretHash
	 */
  getSecretHash() {
    return this.secretHash
  }

  /**
	 * Verifies secret against stored hash
	 * @param {string} secret
	 * @return {Promise<boolean>} isMatch
	 */
  verifySecretMatch(secret) {
    return new Promise((resolve, reject) => {
      const bcryptjs = require('bcryptjs')
      bcryptjs.compare(secret, this.getSecretHash(), (error, isMatch) => {
        if (error) {
          reject(error)
          return
        }

        resolve(isMatch)
      })
    })
  }

  /**
	 * Parse database result
	 * @param {object} dbResult
	 */
  parseDb(dbResult) {
    if (typeof dbResult.name === 'string' && dbResult.name) { this.name = dbResult.name }
    if (typeof dbResult.secretHash === 'string' && dbResult.secretHash) { this.secretHash = dbResult.secretHash }
  }
}

module.exports = ApiApp
