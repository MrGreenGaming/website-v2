<template>
  <v-card>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon>attach_money</v-icon>
      <v-toolbar-title class="subheading ml-0">
        Recent Donations
      </v-toolbar-title>
    </v-toolbar>

    <v-container>
      <v-layout column>
        <v-flex v-if="$auth.$state.loggedIn && $auth.$state.user.profileUrl">
          To make your donations anonymous <br><b><a :href="$auth.$state.user.profileUrl+'edit/#core_pfield_30'" target="_blank">Click Here</a></b>
        </v-flex>
        <v-list v-if="donationList.length > 0" two-line>
          <div v-for="(item, index) in donationList" :key="index">
            <v-list-tile avatar>
              <v-list-tile-avatar>
                <img :src="require('@/assets/images/icons/paypal.png')" alt="PayPal">
              </v-list-tile-avatar>
              <v-list-tile-content>
                <a v-if="item.formattedname" style="text-decoration:none;" :href="item.url" target="_blank">
                  <v-list-tile-title v-html="item.formattedname" />
                </a>

                <v-list-tile-title v-else>
                  {{ item.name || "Anonymous" }}
                </v-list-tile-title>
                <v-list-tile-sub-title><Timeago :datetime="item.date" /></v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action class="font-weight-bold subheading">
                €{{ item.amount }}
              </v-list-tile-action>
            </v-list-tile>
            <v-divider />
          </div>
        </v-list>
        <v-flex v-else>
          <v-subheader>No recent donations</v-subheader>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      donationList: {},
      listAmount: 10
    }
  },
  mounted() {
    this.getData()
  },
  methods: {
    async getData() {
      const returned = await this.$axios
        .$get('/api/web/getmonthdonations')
        .catch((err) => {
          console.error(err)
        })
      if (returned && typeof returned === 'object') {
        if (Object.keys(returned).length > this.listAmount) {
          this.donationList = returned.slice(0, this.listAmount)
        } else {
          this.donationList = returned
        }
      }
    }
  }
}
</script>

<style>
</style>
