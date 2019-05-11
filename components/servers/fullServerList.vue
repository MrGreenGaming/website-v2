<template>
  <div>
    <v-flex v-for="server in servers" :key="server.name" class="mb-2">
      <v-card>
        <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
          <v-toolbar-title class="subheading ml-0">
            {{ server.name }}
          </v-toolbar-title>
        </v-toolbar>
        <v-container fluid>
          <v-layout row>
            <v-img
              v-if="$vuetify.breakpoint.smAndUp"
              :src="require('@/assets/images/logos/'+server.image)"
              max-width="70px"
              min-width="50px"
              contain
            />
            <v-layout column class="ml-3">
              <v-flex class="body-2" v-html="server.description">
                {{ server.description }}
              </v-flex>
              <v-flex>
                <a class="black white--text px-2 py-1" :href="server.url">{{ server.ip }}</a>
              </v-flex>
            </v-layout>
          </v-layout>
          <v-layout column>
            <v-flex class="mt-2" />

            <v-flex v-if="server.gameStateImage" class="mt-3">
              <v-img :src="server.gameStateImage" min-height="120px" max-width="600px" contain />
            </v-flex>
          </v-layout>
        </v-container>
      </v-card>
    </v-flex>
  </div>
</template>

<script>
export default {
  data() {
    return {
      servers: [
        {
          name: 'MTA:SA Race',
          image: 'mtasa-big.png',
          ip: 'race.mrgreengaming.com:22003',
          url: 'mtasa://race.mrgreengaming.com:22003',
          description:
						'Are you all about driving in GTA: San Andreas? Compare yourself against other drivers on our Race server.<br>Set new top times, get achievements and make new international friends, all at the same time. <br>',
          gameStateImage:
						'http://www.game-state.com/5.2.65.5:22003/n-560x95_FFFFFF_FFFFFF_000000_000000.png'
        },
        {
          name: 'MTA:SA Race Mix',
          image: 'mtasa-big.png',
          ip: 'racemix.mrgreengaming.com:22003',
          url: 'mtasa://racemix.mrgreengaming.com:22003',
          description:
						'A mix of various in-vehicle gamemodes such as Destruction Derby, Reach The Flag, Capture The Flag and more!<br>',
          gameStateImage:
						'http://www.game-state.com/5.2.65.6:22003/n-560x95_FFFFFF_FFFFFF_000000_000000.png'
        }
      ]
    }
  },
  methods: {}
}
</script>
