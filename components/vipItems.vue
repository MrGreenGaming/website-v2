<template>
  <v-card>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon class="mr-1">
        star
      </v-icon>
      <v-toolbar-title class="subheading ml-0">
        VIP Features
      </v-toolbar-title>
    </v-toolbar>

    <v-container grid-list-md>
      <h3>Some exclusive VIP features include:</h3>
      <v-layout row wrap>
        <v-flex v-for="item in vipItems" :key="item.name" xs12 sm6 fill-height>
          <v-card dark color="primary" style="min-height:180px;">
            <v-card-title class="subheading font-weight-bold">
              {{ item.name }}
            </v-card-title>
            <v-card-text>
              {{ item.description }}
            </v-card-text>
            <v-card-actions v-if="item.comingsoon">
              <v-btn flat color="warning">
                Coming Soon
              </v-btn>
            </v-card-actions>
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
      vipItems: [
        {
          name: 'Rainbow colors (Vehicle body, wheels & lights',
          description:
						'Continuously changing colors for your paintjob, wheel rims and/or lights'
        },
        {
          name: '+50% bonus GC for winning/finising map',
          description:
						"While you're VIP, earn 50% more than normal for winning and finishing a map."
        },
        {
          name: 'Forum, discord and ingame tags',
          description:
						"Show your support with an ingame, discord and forum badge exclusively for VIP's."
        },
        {
          name: '1 FREE map purchase daily',
          description: 'You can purchase 1 free map daily.'
        },
        {
          name: 'Exclusive VIP character skins',
          description:
						'From 5 to 10 different modded skins/characters (more can be added later).'
        },
        {
          name: 'Longer nicknames (# color codes do not count)',
          description:
						"Have a name up to 22 characters, and add as many colors as you'd like."
        },
        {
          name: 'Blinking vehicle lights',
          description:
						'Have blinking vehicle lights in different modes/order/speed.'
        },
        {
          name: 'Police siren lights',
          description: 'Add police siren lights to your vehicles',
          comingsoon: true
        }
      ]
    }
  }
}
</script>
