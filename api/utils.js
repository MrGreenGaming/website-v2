class Utils {
    static parseToNumber(value) {
        if (typeof value === 'number') {
            return value
        } else if (typeof value === 'string') {
            return parseInt(value, 10)
        }

        return undefined
      }
}

module.exports = Utils