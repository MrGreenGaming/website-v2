class Utils {
  static displayText(text) {
    return this.nl2br(this.escapeHtml(text))
  }

  static nl2br(str) {
    return (str + '').replace(/(\r\n|\n\r|\r|\n)/g, '<br>$1')
  }

  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }

    return text.replace(/[&<>"']/g, (m) => {
      return map[m]
    })
  }

  /**
	 * Returns a number whose value is limited to the given range.
	 *
	 * Example: limit the output of this computation to between 0 and 255
	 * (x * 255).clamp(0, 255)
	 *
	 * @param {number} value Current value
	 * @param {number} min The lower boundary of the output range
	 * @param {number} max The upper boundary of the output range
	 * @returns A number in the range [min, max]
	 * @type number clampedValue
	 */
  static mathClamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  /**
	 * Generate md5 hash
	 * @param data
	 * @return {string} hexRepresentation
	 */
  static md5(data) {
    const crypto = require('crypto')
    return crypto
      .createHash('md5')
      .update(data)
      .digest('hex')
  }
}

module.exports = Utils
