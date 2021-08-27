<template>
  <v-flex class="pt-3">
    <v-card color="primary" dark style="min-height:80px;">
      <v-layout v-if="$auth.$state.loggedIn" row>
        <!-- <v-flex width="80"> -->
        <v-avatar tile size="80">
          <img :src="$auth.$state.user.photoUrl" alt="User avatar">
        </v-avatar>
        <!-- </v-flex> -->
        <v-layout column class="ml-2 py-1 subheading">
          <v-flex>
            Welcome back, {{ $auth.$state.user.name || "" }}!
          </v-flex>
          <v-flex class="caption">
            {{ userVip }} days of VIP
          </v-flex>
          <v-flex class="caption">
            {{ userGc }} GreenCoins
          </v-flex>
        </v-layout>
      </v-layout>

      <!-- Show login/register when not logged in -->
      <v-layout v-if="!$auth.$state.loggedIn" class="ml-2 py-1" fill-height column>
        You are not logged in.
        <v-layout align-center>
          <v-btn style="width:100px;" class="ml-0" @click="login()">
            Log In
          </v-btn>
          or
          <v-btn style="width:100px;" @click="register()">
            Register
          </v-btn>
        </v-layout>
      </v-layout>
    </v-card>
  </v-flex>
</template>

<script>
export default {
  data() {
    return {
      userGc: 0,
      userVip: 0,
      refetchTimer: false
    }
  },
  computed: {},
  mounted() {
    this.refetchTimer = setInterval(() => this.getUserInfo(), 300000)
    this.getUserInfo()
  },
  methods: {
    login() {
      this.$auth.loginWith('forums')
    },
    register() {
      window.location = 'https://forums.mrgreengaming.com/register/'
    },
    async getUserInfo() {
      if (!this.$auth.$state.loggedIn) return

      const userId = this.$auth.$state.user.id
      let userInfo
      try {
        userInfo = await this.$axios.$get(
          '/api/web/getmembercurrency/?forumid=' + userId
        )
      } catch (err) {
        console.error(err)
      }

      if (userInfo) {
        this.userGc = userInfo.gc || 0
        this.userVip = this.getVipDays(userInfo.vip) || 0
      }
    },
    getVipDays(timestamp) {
      if (!timestamp) return

      const vipDate = new Date(timestamp * 1000)

      const diff = vipDate.getTime() - new Date().getTime()
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24))

      return diffDays
    }
  }
}
</script>
