import request from 'request'

class PayPalService {
  static validate(body = {}) {
    return new Promise((resolve, reject) => {
      // Prepend 'cmd=_notify-validate' flag to the post string
      let postreq = 'cmd=_notify-validate'

      // Iterate the original request payload object
      // and prepend its keys and values to the post string
      Object.keys(body).map((key) => {
        postreq = `${postreq}&${key}=${body[key]}`
        return key
      })
      // Sandbox: https://ipnpb.sandbox.paypal.com/cgi-bin/webscr
      // Live: https://ipnpb.paypal.com/cgi-bin/webscr
      const options = {
        url: 'https://ipnpb.paypal.com/cgi-bin/webscr',
        method: 'POST',
        headers: {
          'Content-Length': postreq.length
        },
        encoding: 'utf-8',
        body: postreq
      }

      // Make a post request to PayPal
      request(options, (error, response, resBody) => {
        if (error || response.statusCode !== 200) {
          reject(new Error(error))
          return
        }

        // Validate the response from PayPal and resolve / reject the promise.

        if (resBody.substring(0, 8) === 'VERIFIED') {
          resolve(true)
        } else if (resBody.substring(0, 7) === 'INVALID') {
          reject(new Error('IPN Message is invalid.'))
        } else {
          reject(new Error('Unexpected response body.'))
        }
      })
    })
  }

  static async handle(body) {
    const transactionType = body.txn_type

    let orderData
    try {
      orderData = JSON.parse(body.custom)
    } catch (e) {
      orderData = false
    }

    // Save ipn message to database
    const ipnInsertQuery =
			'INSERT INTO `paypal_ipn`(`transaction_id`, `transaction_type`, `payer_id`, `forum_id`, `payment_status`, `ipn_body`, `sandbox`) VALUES (?, ?, ?, ?, ?, ?, ?)'

    try {
      await db.query(ipnInsertQuery, [
        body.txn_id || null,
        transactionType,
        body.payer_id,
        orderData.forumid || null,
        body.payment_status,
        JSON.stringify(body),
        body.test_ipn || false
      ])
    } catch (err) {
      console.error(err)
      return
    }

    // Handle succesfull payment (vip and gc)
    // TODO: handle chargebacks?
    if (
      body.payment_status === 'Completed' &&
			orderData &&
			typeof parseInt(orderData.forumid, 10) === 'number' &&
			typeof orderData.type === 'string' &&
			typeof parseInt(orderData.vip, 10) === 'number' &&
			typeof parseInt(orderData.gc, 10) === 'number'
    ) {
      // Check if transaction is already handled
      const checkQuery = 'SELECT * FROM `payments` WHERE `transaction_id` = ?'
      let alreadyHandled = false
      try {
        alreadyHandled = await db.query(checkQuery, body.txn_id)
        if (alreadyHandled.length !== 0) {
          // Already handled
          console.log('payments:', body.txn_id + ' payment already handled.')
          return
        }
      } catch (err) {
        console.error(err)
        return
      }

      // Insert into payments db
      const paymentQuery =
				'INSERT INTO `payments`(`payment_provider`, `transaction_id`, `forum_id`, `payer_id`, `payer_email`, `amount`, `greencoins_received`, `vip_received`, `sandbox`) VALUES (?,?,?,?,?,?,?,?,?)'
      try {
        await db.query(paymentQuery, [
          'paypal',
          body.txn_id,
          orderData.forumid,
          body.payer_id,
          body.payer_email,
          body.mc_gross_1,
          orderData.gc,
          orderData.vip,
          body.test_ipn
        ])
      } catch (err) {
        console.error('Payment Query Error:', err)
        return
      }

      // Return when in sandbox mode
      if (body.test_ipn) return

      // Reward vip
      if (orderData.vip > 0) {
        const VipManager = require('../../server/base/vipManager')
        VipManager.addVip(orderData.forumid, orderData.vip)
      }

      // Reward gc
      if (orderData.gc > 0) {
        const user = await Users.get(orderData.forumid)
        if (user) {
          user
            .getCoins()
            .submitTransaction(
              orderData.gc,
              undefined,
              `Payment order #${body.txn_id}`,
              true
            )
        }
      }

      // Send user a forum message
      let orderString = ''

      // There must be a better way to do this =_=
      if (orderData.gc > 0 && orderData.vip > 0) {
        orderString =
					orderData.gc + ' GreenCoins and ' + orderData.vip + ' days of VIP '
      } else if (orderData.gc > 0) {
        orderString = orderData.gc + ' GreenCoins '
      } else {
        orderString = orderData.vip + ' days of VIP '
      }

      const forumMessages = require('../base/forumMessages')
      await forumMessages
        .sendMessage(
          orderData.forumid,
          `Donation #${body.txn_id}`,
          '<h1>Donation Complete!</h1><br>Thank you for supporting MrGreenGaming!<br><b>' +
						orderString +
						"</b>have been added to your account! <br> If you are ingame, please reconnect for it to take effect. If you haven't received your rewards within 10 minutes then please contact Cena#1101 on Discord or on the forums!<br><br>If you have any questions or problems, please contact one of our staff members.<br><sub>This is an automated message. Please do not reply</sub>"
        )
        .catch((err) => {
          console.error('sendmessaegerr: ', err)
        })
    }
  }
}

module.exports = PayPalService
