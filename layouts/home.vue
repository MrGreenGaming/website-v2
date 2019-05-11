<template>
  <v-app class="appStyle" :style="appStyle">
    <Navbar />
    <v-content>
      <v-container class="px-0 pt-0 mb-0 pb-0 mt-0" style="max-width:1110px;" fluid>
        <mtaYouTubeVideo />
      </v-container>
      <v-container class="px-0 pt-0 mb-0 pb-0 mt-0" style="max-width:1110px;" fluid>
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
import mtaYouTubeVideo from '@/components/mtaYouTubeVideo'
export default {
  name: 'App',
  components: {
    mtaYouTubeVideo,
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
