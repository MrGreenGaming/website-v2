<template>
  <div class="py-4" style="min-height:850px;">
    <h1 class="mb-3">
      VIP Horns
    </h1>
    <v-card class="mt-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-toolbar-title class="subheading ml-0">
          VIP Horns
        </v-toolbar-title>
      </v-toolbar>

      <v-container>
        <h3>What are VIP horns?</h3>
        <v-divider inset class="mb-3" />
        <p>As a VIP you have access to VIP horns. VIP horns are your own private horns, that you can upload/change at any time with a simple file upload.</p>
        <p>While ingame, you can bind the horns to what ever button you like, and has unlimited uses (like the unlimited gc horn perk).</p>
      </v-container>
    </v-card>
    <vipHorns v-if="$auth.$state.loggedIn && $auth.user && $auth.user.vip" />

    <v-card v-if="$auth.$state.loggedIn && $auth.user && !$auth.user.vip" class="mt-3">
      <!-- User is not VIP -->
      <v-container>
        <v-layout align-center column>
          <h2>To use custom horns you must be a VIP</h2>
          <v-btn large color="primary" nuxt to="/greencoins/donate">
            Get VIP
          </v-btn>
        </v-layout>
      </v-container>
    </v-card>
    <v-card v-if="!$auth.$state.loggedIn" class="mt-3">
      <!-- User is not logged in -->
      <v-container>
        <v-layout align-center column>
          <h2>To use custom horns you must be a logged in.</h2>
          <h3>Please log in and return to this page.</h3>
          <v-btn large color="primary" @click="$auth.loginWith('forums')">
            Log In
          </v-btn>
        </v-layout>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import vipHorns from '@/components/vipHorns'
export default {
  components: {
    vipHorns
  },
  head() {
    return {
      title: 'VIP Horns - Mr. Green Gaming'
    }
  },
  data() {
    return {}
  },
  methods: {}
}
</script>

<style scoped>

</style>
