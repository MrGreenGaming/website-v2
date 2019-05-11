<template>
  <v-layout v-if="!$auth.loggedIn" class="pt-5" column>
    <v-container class="callbackContainer" flat>
      <v-layout class="mt-3" column align-center justify-center>
        <h1>Please log in or register</h1>
        <v-btn style="width:300px;" class="ml-0 my-3" dark @click="login()">
          Click here to log in
        </v-btn>
        <v-btn style="width:300px;" class="ml-0 my-3" dark @click="register()">
          Click here to register
        </v-btn>
      </v-layout>
    </v-container>
  </v-layout>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  computed: {},
  mounted() {
    if (this.$auth.loggedIn) {
      this.$router.push('/')
    }
  },
  methods: {
    login() {
      this.$auth.loginWith('forums')
    },
    register() {
      window.location = 'https://mrgreengaming.com/forums/register/'
    }
  }
}
</script>

<style scoped>
.callbackContainer {
	min-height: 1000px;
}
</style>
