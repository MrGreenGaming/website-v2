<template>
  <v-app class="appStyle" :style="appStyle">
    <Navbar />
    <v-content>
      <v-container class="px-1 pt-0 mb-0 pb-0" style="max-width:1110px;" fluid>
        <v-card class="px-4" :class="{'px-0 mx-0': $vuetify.breakpoint.smAndDown}" color="#fafafa">
          <router-view />
        </v-card>
      </v-container>
    </v-content>
    <Footer />
  </v-app>
</template>

<script>
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default {
  name: 'App',
  components: {
    Footer,
    Navbar
  },
  data() {
    return {
      appStyle: {
        backgroundColor: '#efefef'
      }
    }
  }
}
</script>

<style>
.slim-toolbar-padding .v-toolbar__content {
	padding-left: 14px;
}
</style>
