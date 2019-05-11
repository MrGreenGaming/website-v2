<template>
  <v-card class="elevation-5">
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon>monetization_on</v-icon>
      <v-toolbar-title class="subheading ml-2">
        Donate
      </v-toolbar-title>
    </v-toolbar>

    <v-container>
      <v-layout column>
        <v-stepper v-model="donationStep" alt-labels class="elevation-0">
          <v-stepper-header class="elevation-0">
            <v-stepper-step :complete="donationStep > 1" step="1">
              Donation Type
            </v-stepper-step>

            <v-divider />

            <v-stepper-step :complete="donationStep > 2" step="2">
              Donation Amount
            </v-stepper-step>

            <v-divider />

            <v-stepper-step step="3">
              Checkout
            </v-stepper-step>
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <v-container
                style="min-height:200px;"
                class="mb-5"
              >
                <v-layout v-if="isAuthenticated" align-center justify-center column>
                  <h2>Select donation type</h2>
                  <!-- <v-flex>
                    Donating VIP will give less GreenCoins than a GreenCoins donation, but a GreenCoins donation will not give VIP privileges.
                  </v-flex> -->
                  <v-flex>
                    You can either donate for GreenCoins or VIP. VIP will grant you some exclusive in-game features.
                  </v-flex>
                  <v-layout align-center wrap class="mt-4" :column="$vuetify.breakpoint.smAndDown">
                    <v-btn large style="width:150px;" color="primary" :disabled="!isAuthenticated || !canDonate" @click="donationStepper('onVIP')">
                      VIP
                    </v-btn>
                    <span class="mx-3 title">or</span>
                    <v-btn large style="width:150px;" color="primary" :disabled="!isAuthenticated || !canDonate" @click="donationStepper('onGreenCoins')">
                      GreenCoins
                    </v-btn>
                  </v-layout>
                </v-layout>
                <v-layout v-else column align-center justify-center class="title">
                  <h3 class="mb-3">
                    You need to be logged in to donate.
                  </h3>
                  <v-btn color="warning" large @click="$auth.loginWith('forums')">
                    Log in
                  </v-btn>
                </v-layout>
              </v-container>
            </v-stepper-content>

            <v-stepper-content step="2">
              <v-container
                style="min-height:200px;"
                class="mb-5"
              >
                <!-- VIP -->
                <v-layout align-center justify-center column>
                  <h2>Set donation amount</h2>
                  <p>If you set the donation amount, you can directly see what you will receive</p>
                  <v-flex xs8>
                    <v-text-field
                      v-model="donationData.amount"
                      label="Amount"
                      :value="donationData.amount"
                      :mask="'####'"
                      :rules="[rules.minimumAmount]"
                      prefix="€"
                      @input="onDonationInput()"
                      @focus="donationData.amount = ''"
                    />
                  </v-flex>
                  <h2 class="mt-2">
                    €{{ donationData.amount || 0 }} will get you:
                  </h2>
                  <!-- VIP -->
                  <v-flex v-if="donationData.type === 'vip'" class="subheading">
                    <b class="primary--text">{{ donationReceived.days }}</b> days of VIP
                  </v-flex>
                  <v-flex v-if="donationData.type === 'greencoins'" class="subheading">
                    <b class="primary--text">{{ donationReceived.greencoins }}</b> GreenCoins
                  </v-flex>
                  <!-- GreenCoins -->
                </v-layout>
              </v-container>
              <v-layout justify-center wrap>
                <v-btn
                  color="primary"
                  :disabled="parseInt(donationData.amount) < parseInt(donationMinAmount)"
                  large
                  @click="donationStepper('onAmountSet')"
                >
                  Continue
                </v-btn>

                <v-btn flat large @click="donationStepper('onCancel')">
                  Cancel
                </v-btn>
              </v-layout>
            </v-stepper-content>

            <v-stepper-content step="3">
              <v-container
                style="min-height:200px;"
                class="mb-5"
              >
                <v-layout align-center justify-center column>
                  <v-flex v-if="donationComplete" class="primary--text font-weight-bold display-2">
                    Donation Complete!
                  </v-flex>
                  <v-flex v-if="donationComplete" class="primary--text title">
                    Thank you for supporting this community.
                  </v-flex>
                  <v-subheader v-if="donationComplete">
                    You will receive your rewards shortly!
                  </v-subheader>
                  <v-list>
                    <h2>Donation Summary</h2>
                    <v-subheader v-if="!donationComplete">
                      Please review your order before purchasing.
                    </v-subheader>

                    <v-list-tile v-if="donationData.type == 'vip'" @click="true">
                      <b class="mr-2">VIP:</b> +{{ donationReceived.days }} days
                    </v-list-tile>
                    <v-divider />
                    <v-list-tile @click="true">
                      <b v-if="donationReceived.greencoins > 0 && donationData.type != 'vip'" class="mr-2">GreenCoins:</b> +{{ donationReceived.greencoins }} GC
                    </v-list-tile>
                    <v-divider />
                    <v-list-tile @click="true">
                      <b class="mr-2">Total: € {{ donationData.amount }}</b>
                    </v-list-tile>
                  </v-list>
                  <v-divider class="mb-5" />
                  <v-subheader v-if="!donationComplete">
                    You will receive your items once the payment is completed.
                  </v-subheader>
                  <!-- PayPal -->

                  <no-ssr v-if="canDonate">
                    <paypal-checkout
                      v-if="!donationComplete"
                      class="mt-3"
                      style="width:70%;"
                      :env="paypalEnv"
                      :amount="donationData.amount.toString()"
                      currency="EUR"
                      :client="paypal"
                      :items="getItemObject()"
                      :button-style="{shape:'rect',size:'responsive'}"
                      :notify-url="ipnNotifyUrl"
                      :custom="getCustomData()"
                      @payment-authorized="paymentAuthorized"
                      @payment-completed="paymentCompleted"
                      @payment-cancelled="paymentCancelled"
                    />
                  </no-ssr>
                  <!-- PayPal -->
                </v-layout>
              </v-container>

              <v-layout justify-center>
                <v-btn dark color="black" @click="donationStepper('onCancel')">
                  Reset Donation
                </v-btn>
              </v-layout>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      paypalEnv: 'production',
      paypal: {
        sandbox:
					'Aak7vbZvFjP1AaOFRwPcrxU-6oEt73QuCC6VmgcCVMCiT3j2jZbiZsCHyoM5RjkXrYBtJwfTtRkxQz0_',
        production:
					'ARWB1_tfferKbBcSR7YwMmQop6fXtl-E2fBZnafEdwdAomKr0_PmINirF8l3Ad7ngCuzzzRCVUcGqqKS'
      },
      donationStep: 1,
      donationComplete: false,
      canDonate: false,
      donationPrice: {
        // Price per 1 EUR -- Fetched from database
        greencoins: 1000,
        vip: {
          greencoins: 500,
          days: 5
        }
      },
      donationMinAmount: 2,
      donationData: {
        type: false,
        amount: '0'
      },
      donationReceived: {
        greencoins: 0,
        days: 0
      },
      ipnNotifyUrl: 'https://mrgreengaming.com/api/ipn/',
      rules: {
        minimumAmount: value =>
          parseInt(value, 10) >= parseInt(this.donationMinAmount, 10) ||
					'Minimum donation amount: €' + this.donationMinAmount
      }
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'loggedInUser', 'isAdmin'])
  },
  mounted() {
    this.getDonationPricing()
  },

  methods: {
    donationStepper(action) {
      switch (action) {
        case 'onCancel':
          // Cancel code
          this.donationStep = 1
          this.resetData()
          break
        case 'onVIP':
          // VIP code
          this.donationData.type = 'vip'
          this.donationStep = 2
          break
        case 'onGreenCoins':
          // GreenCoins Code
          this.donationData.type = 'greencoins'
          this.donationStep = 2
          break
        case 'onAmountSet':
          // Refetch pricing
          this.getDonationPricing()
          // Amount set, move to checkout
          this.donationStep = 3
      }
    },
    onDonationInput() {
      // Check for leading zero
      const regExp = /^0[0-9].*$/
      if (
        regExp.test(this.donationData.amount) ||
				this.donationData.amount === 0
      ) {
        this.donationData.amount = ''
      }
      this.setDonationAmount()
    },
    setDonationAmount() {
      const amount = this.donationData.amount
      if (amount > 0) {
        if (this.donationData.type === 'greencoins') {
          this.donationReceived.greencoins =
						amount * this.donationPrice.greencoins
        } else {
          this.donationReceived.greencoins =
						amount * this.donationPrice.vip.greencoins
          this.donationReceived.days = amount * this.donationPrice.vip.days
        }
      } else {
        this.donationReceived.greencoins = 0
        this.donationReceived.days = 0
      }
    },
    resetData() {
      this.donationData = {
        type: false,
        amount: 0
      }
      this.donationReceived = {
        greencoins: 0,
        days: 0
      }
      this.donationComplete = false
    },
    getItemObject() {
      const donoType = this.donationData.type
      let itemName
      let itemDesc
      if (donoType === 'greencoins') {
        itemName =
					'MrGreen GreenCoins (' + this.donationReceived.greencoins + ' GC)'
        itemDesc =
					'You will receive: ' +
					this.donationReceived.greencoins +
					' GreenCoins'
      } else if (donoType === 'vip') {
        itemName =
					'MrGreen VIP ' + ' (' + this.donationReceived.days + ' days)'
        itemDesc =
					'You will receive: ' +
					this.donationReceived.days +
					' days of VIP and ' +
					this.donationReceived.greencoins +
					' GreenCoins'
      } else {
        return []
      }

      const items = [
        {
          name: itemName,
          description: itemDesc,
          quantity: '1',
          price: this.donationData.amount,
          currency: 'EUR'
        }
      ]

      return items
    },
    paymentAuthorized: function (data) {
      // console.log("Authorized", data);
    },
    paymentCompleted: function (data) {
      // console.log("Completed", data);
      this.donationComplete = true
    },
    paymentCancelled: function (data) {
      // console.log("Cancelled", data);
    },
    getCustomData() {
      if (!this.$auth.$state.user) return
      const theData = {
        type: this.donationData.type || false,
        forumid: this.$auth.$state.user.id || false,
        vip: this.donationReceived.days || 0,
        gc: this.donationReceived.greencoins || 0
      }

      return JSON.stringify(theData)
    },
    async getDonationPricing() {
      let theData
      this.canDonate = false
      try {
        theData = await this.$axios.$get('/api/web/getdonationpricing/')
      } catch (err) {
        console.log('Failed getting donation data', err)
        return
      }

      if (
        theData.gc &&
				theData.vip &&
				theData.vip_gc &&
				theData.discount &&
				theData.minimum
      ) {
        this.donationMinAmount = theData.minimum
        this.donationPrice = {
          greencoins: theData.gc,
          vip: {
            greencoins: theData.vip_gc,
            days: theData.vip
          }
        }
        this.canDonate = true
      } else {
        console.error('Failed getting donation pricing.')
      }
    }
  }
}
</script>
