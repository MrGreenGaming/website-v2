<template>
  <v-card>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon class="mr-1">
        storage
      </v-icon>
      <v-toolbar-title class="subheading ml-0">
        Our Servers
      </v-toolbar-title>
    </v-toolbar>

    <v-container>
      <v-layout column justify-start>
        <v-flex v-for="server in gameServers" :key="server.name">
          <v-card flat class="py-2">
            <v-layout row align-center>
              <v-img
                :src="require('../assets/images/logos/'+server.icon)"
                max-height="35px"
                max-width="35px"
                contain
              />
              <v-layout column class="pl-2">
                <span class="font-weight-medium body-2">{{ server.name }}</span>
                <span class="caption grey--text text--darken-2">{{ server.subName }} {{ server.online }}</span>
              </v-layout>
              <v-btn :href="server.link" target="_blank" color="primary" class="py-1" small>
                Join
              </v-btn>
            </v-layout>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      gameServers: [
        {
          name: 'MTA Race',
          subName: 'Online Players:',
          online: 0,
          icon: 'mtasa.png',
          link: 'mtasa://race.mrgreengaming.com:22003'
        },
        {
          name: 'MTA Mix',
          subName: 'Online Players:',
          online: 0,
          icon: 'mtasa.png',
          link: 'mtasa://racemix.mrgreengaming.com:22003'
        },
        {
          name: 'Minecraft SMP',
          subName: 'Online Players:',
          online: 0,
          icon: 'minecraft-logo.png',
          link: 'https://mrgreengaming.com/forums/topic/23573-mr-green-minecraft-survival/'
        },
        {
          name: 'Discord',
          subName: 'Online Players:',
          online: 0,
          icon: 'discord-purple.png',
          link: 'https://discord.gg/ge88KfF'
        }
      ]
    }
  },
  mounted() {
    this.getOnlinePlayers()
    setInterval(this.getOnlinePlayers, 60000) // Refresh player count every x
  },
  methods: {
    async getOnlinePlayers() {
      await this.$axios
        .$get('/api/web/getgameserverinfo/?server=race&server=mix&server=mcsmp&server=discord') // This should be made more dynamic.
        .then((res) => {
          if (res) {
            for (let i = 0; i < res.length; i++) {
              const srv = res[i]

              if (srv.players) {
                this.gameServers[i].online = srv.players.length
              }
            }
          }
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }
}
</script>
