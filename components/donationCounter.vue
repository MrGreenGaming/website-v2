<template>
  <v-card>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon>attach_money</v-icon>
      <v-toolbar-title class="subheading ml-0">
        Donation Goal
      </v-toolbar-title>
    </v-toolbar>

    <v-container>
      <v-layout column>
        <span>Help us reach the monthly goal in order to pay for our expenses, such as server hosting bills.</span>
        <v-flex v-if="donationCurrent > donationGoal" align-self-center>
          <h2 class="primary--text mb-3">
            Donation goal reached!
          </h2>
        </v-flex>

        <v-flex align-self-center>
          <v-progress-circular
            :rotate="360"
            :size="150"
            :width="20"
            :value="calculateDonationProgress()"
            color="primary"
            class="my-2"
          >
            <v-layout row>
              <span class="font-weight-bold">€{{ donationCurrent }}</span>
              <span class="mx-1">of</span>
              <span class="font-weight-bold">€{{ donationGoal }}</span>
            </v-layout>
          </v-progress-circular>
        </v-flex>

        <v-btn v-if="showButton" dark color="primary" @click="$router.push({ path: '/greencoins/donate/' });">
          Donate
        </v-btn>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  props: {
    showDonationButton: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      donationGoal: 60,
      donationCurrent: 0,
      showButton: this.showDonationButton,
      monthDonations: {}
    }
  },
  watch: {
    monthDonations: function (val) {
      let total = 0
      for (const row of val) {
        total = total + row.amount
      }
      this.donationCurrent = total
    }
  },
  mounted() {
    this.getDonationData()
  },
  methods: {
    async getDonationData() {
      let fetch
      let goal
      try {
        goal = await this.$axios.$get('/api/web/getdonationgoal')
        fetch = await this.$axios.$get('/api/web/getmonthdonations/')
      } catch (err) {
        this.donationGoal = 0
        this.monthDonations = 0
        return
      }
      this.donationGoal = goal
      this.monthDonations = fetch
    },
    calculateDonationProgress() {
      return (this.donationCurrent / this.donationGoal) * 100
    }
  }
}
</script>
