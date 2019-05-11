<template>
  <v-container class="mx-0 px-0" grid-list-lg fluid>
    <h1 class="mb-3">
      Donate for VIP or GreenCoins
    </h1>
    <v-layout column wrap class="pt-4">
      <v-flex>
        <donate />
      </v-flex>
      <v-flex>
        <vipItems />
      </v-flex>

      <!-- <mtaYouTubeVideo /> -->
      <v-layout row wrap class="mb-3">
        <v-flex xs12 sm6>
          <donationCounter :show-donation-button="false" />
        </v-flex>

        <v-flex xs12 sm6>
          <donationList />
        </v-flex>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
import donate from '@/components/donate'
import donationCounter from '@/components/donationCounter'
import donationList from '@/components/donationList'
import vipItems from '@/components/vipItems'
// import mtaYouTubeVideo from "@/components/mtaYouTubeVideo";

export default {
  head() {
    return {
      title: 'Donate - Mr. Green Gaming'
    }
  },
  components: {
    donate,
    vipItems,
    donationList,
    donationCounter
    // mtaYouTubeVideo
  }
}
</script>

<style></style>
