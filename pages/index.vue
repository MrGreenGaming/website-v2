<template>
  <div>
    <gcUserInfo />

    <v-container grid-list-md fluid class="mx-0 my-0 px-0 py-0">
      <v-layout row wrap class="mt-4">
        <!-- content -->
        <v-flex xs12 sm12 md8>
          <v-flex class="mb-3">
            <v-card>
              <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
                <v-toolbar-title class="subheading ml-0">
                  Welcome to Mr. Green Gaming
                </v-toolbar-title>
              </v-toolbar>
              <v-container>
                Mr. Green Gaming is an online games community founded back in 2006. We host gameservers for various games such as
                <b>Multi Theft Auto: San Andreas</b>,
                <b>Garry's Mod</b> and more. Everyone is welcome to play on our public servers or by joining an upcoming online event.
              </v-container>
            </v-card>
          </v-flex>

          <v-flex class="my-3">
            <communityNews :news="communityNews" />
          </v-flex>
        </v-flex>

        <!-- sidebar -->
        <v-flex xs12 sm12 md4>
          <v-flex class="mb-3">
            <serverList />
          </v-flex>

          <v-flex class="my-3">
            <donationCounter />
          </v-flex>

          <v-flex class="my-3">
            <donationList />
          </v-flex>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script>
// import mtaYouTubeVideo from "@/components/mtaYouTubeVideo";
import donationCounter from '@/components/donationCounter'
import donationList from '@/components/donationList'
import serverList from '@/components/serverList'
import communityNews from '@/components/communityNews'
import gcUserInfo from '@/components/greencoins/gcUserInfo'

export default {
  layout(context) {
    return 'home'
  },
  components: {
    gcUserInfo,
    donationList,
    donationCounter,
    communityNews,
    serverList
    // mtaYouTubeVideo
  },
  data() {
    return {
      communityNews: false,
      userInfo: false
    }
  },
  async asyncData({ $axios }) {
    let theData
    try {
      theData = await $axios.$get('/api/web/communitynews/')
    } catch (e) {
      console.log('communityNews asyncData Error:', e.config.url, e.response != null ? e.response.status : e)
      return { communityNews: [] }
    }
    return { communityNews: theData }
  },
  created() {
    // this.fetchTheUser();
    // console.log(this.$auth);
    // console.log(this.$auth.user);
  },
  methods: {
    async logOut() {
      await this.$auth.logout().catch((e) => {
        this.error = e + ''
        console.log(this.error)
      })
    }
  }
}
</script>

<style>
</style>
