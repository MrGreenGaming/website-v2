class UserCoins {
  /**
	 * Construct UserCoins class
	 * @param {User} user
	 */
  constructor(user) {
    this.user = user

    /** @private **/
    this.balance = 0
  }

  /**
	 * Get parent user
	 * @return {User} user
	 */
  getUser() {
    return this.user
  }

  /**
	 * Give coins
	 * @param {number} amount
	 */
  give(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      console.warn(
        'Coins amount to give was an invalid number',
        typeof amount,
        amount
      )
      return
    }

    this.setBalance(this.getBalance() + amount)
  }

  /**
	 * Take coins
	 * @param {number} amount
	 */
  take(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
      console.warn(
        'Coins amount to take was an invalid number',
        typeof amount,
        amount
      )
      return
    }

    this.setBalance(this.getBalance() - amount)
  }

  /**
	 * Change coins by amount
	 * @param {number} amount
	 */
  changeBalance(amount) {
    if (typeof amount !== 'number' || !amount) {
      console.warn(
        'Coins amount to take was an invalid number',
        typeof amount,
        amount
      )
      return
    }

    this.setBalance(
      amount > 0
        ? this.getBalance() + amount
        : this.getBalance() - Math.abs(amount)
    )
  }

  /**
	 * Set new coins balance
	 * @param {number} newBalance
	 */
  setBalance(newBalance) {
    if (typeof newBalance !== 'number') return

    newBalance = Utils.mathClamp(newBalance, -2147483648, 2147483647)
    if (newBalance === this.balance) return

    // Clamp to MySQL `int` types limits
    this.balance = newBalance
    this.getUser().setDataChanged()
  }

  /**
	 * Get current coins balance
	 * @return {number} coinsBalance
	 */
  getBalance() {
    return typeof this.balance === 'number' ? this.balance : 0
  }

  /**
	 * Submit transaction
	 * @param {number} amount
	 * @param {number} appId
	 * @param {string} comments
	 * @param {boolean} [force]
	 * @return {Promise<number>} success
	 */
  submitTransaction(amount, appId, comments, force) {
    return new Promise(async (resolve, reject) => {
      if (!amount) {
        resolve(false)
        return
      }

      // Check if we can afford it
      if (!force) {
        if (amount < 0) {
          if (this.getBalance() - Math.abs(amount) < 0) {
            resolve(false)
            return
          }
        }
      }

      // Store transaction to database
      let transactionId
      try {
        const dbResults = await db.query(
          `INSERT INTO \`coinsTransactions\` SET ?`,
          [
            {
              userId: this.getUser().getId(),
              amount,
              appId,
              comments
            }
          ]
        )
        transactionId = dbResults.insertId
      } catch (error) {
        reject(error)
        return
      }

      if (amount < 0) this.take(Math.abs(amount))
      else this.give(amount)

      resolve(transactionId)
    })
  }
}

module.exports = UserCoins
