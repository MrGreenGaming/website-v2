const consola = require('consola')
class Database {
  /**
	 * Initialize a new database
	 * @param {string} socketPath
	 * @param {string} host
	 * @param {number} port
	 * @param {string} user
	 * @param {string} password
	 * @param {string} database
	 * @param {number} connectionLimit
	 */
  constructor(
    socketPath,
    host,
    port,
    user,
    password,
    database,
    connectionLimit
  ) {
    this.database = database

    this.isConnected = false
    const mysql = require('mysql')
    this.pool = mysql.createPool({
      host,
      user,
      password,
      database,
      connectionLimit,
      socketPath,
      debug: false,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: false
    })

    // log.info(`Using database: ${database}`);
  }

  /**
	 * Format a SQL statement
	 * @param {string} sql
	 * @param {object|array} inserts
	 * @return {string} sqlQuery
	 */
  static format(sql, inserts) {
    const mysql = require('mysql')
    return mysql.format(sql, inserts)
  }

  /**
	 * Connect to the database
	 * @return {Promise<void>}
	 */
  connect() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.getConnection(true)
        this.isConnected = true
        consola.info(`Connected to database: ${this.database}`)
        resolve()
      } catch (error) {
        this.isConnected = false
        consola.error('Database connection problem:  ' + error, error)
        reject(error)
      }
    })
  }

  /**
	 * Escape a value
	 * @deprecated
	 * @param {any} value
	 * @return {string} formattedValue
	 */
  escape(value) {
    return this.pool.escape(value)
  }

  /**
	 * Get connection handle
	 * @private
	 * @param {boolean} [releaseImmediately=false]
	 * @return {Promise<object>}
	 */
  getConnection(releaseImmediately) {
    return new Promise((resolve, reject) => {
      try {
        this.pool.getConnection((error, connection) => {
          if (connection && releaseImmediately) connection.release()

          if (error) reject(error)
          else resolve(connection)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
	 * Run a query
	 * @param {string} sql
	 * @param {array} [data]
	 * @return {Promise<object|array>} results
	 */
  query(sql, data) {
    return new Promise(async (resolve, reject) => {
      let connection
      try {
        connection = await this.getConnection()
      } catch (error) {
        reject(error)
        return
      }

      const query = connection.query(sql, data, (error, results) => {
        // Give connection back to pool
        connection.release()

        if (error) reject(error)
        else resolve(results)
      })
      consola.trace('Executed DB query', query.sql)
    })
  }

  /**
	 * Get connections pool
	 * @return {Pool} pool
	 */
  getPool() {
    return this.pool
  }
}

// Export class
module.exports = Database
