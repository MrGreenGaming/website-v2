<template>
  <v-layout column>
    <v-layout wrap>
      <v-flex xs12 sm9>
        <v-card class="mb-2">
          <v-layout class="px-2 py-3" align-center>
            <v-avatar size="100px" tile class="mr-2">
              <v-img :src="currentTeam.avatar" contain />
            </v-avatar>
            <h1>{{ currentTeam.name }}</h1>
          </v-layout>
        </v-card>
      </v-flex>

      <v-flex class="pb-2" :class="{'pl-2':$vuetify.breakpoint.smAndUp, 'mb-3':$vuetify.breakpoint.smAndDown}" xs12 sm3>
        <v-card class="mb-2" height="100%">
          <v-layout fill-height column justify-space-around>
            <v-dialog v-model="editTeamDialog" max-width="290">
              <v-btn
                slot="activator"
                block
                style="height:40px;"
                color="primary"
                class="subheading font-weight-regular"
                dark
              >
                Edit Team
              </v-btn>
              <v-card>
                <v-card-title class="headline">
                  Use Google's location service?
                </v-card-title>
                <v-card-text>Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.</v-card-text>
                <v-card-actions>
                  <v-btn color="primary" flat @click="editTeamDialog = false">
                    Save
                  </v-btn>
                  <v-spacer />
                  <v-btn color="red darken-1" flat @click="editTeamDialog = false">
                    Cancel
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-dialog v-model="leaveTeamDialog" max-width="290">
              <v-btn
                slot="activator"
                block
                style="height:40px;"
                color="red"
                class="subheading font-weight-regular"
                dark
              >
                Leave Team
              </v-btn>
              <v-card>
                <v-card-title class="headline">
                  Are you sure?
                </v-card-title>
                <v-card-text>Are you sure you want to leave your team?</v-card-text>
                <v-card-actions>
                  <v-btn color="red darken-1" flat @click="leaveTeamDialog = false">
                    Yes
                  </v-btn>
                  <v-spacer />
                  <v-btn color="primary" flat @click="leaveTeamDialog = false">
                    Cancel
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>

    <v-card class="mb-3">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-toolbar-title class="subheading ml-0">
          Team Information
        </v-toolbar-title>
      </v-toolbar>
      <v-container fluid class="pb-1">
        <v-layout column>
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Team Name:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.name }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Team ID:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.ID }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Tag:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.tag }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Created:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.created }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Owner:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.owner }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Members:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.members }}
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Bank:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.bank }} GC
            </v-flex>
          </v-layout>
          <v-divider />
          <v-layout style="height:50px;" align-center>
            <v-flex class="subheading font-weight-bold" xs6>
              Expiry Date:
            </v-flex>
            <v-flex class="subheading ">
              {{ currentTeam.expire }}
            </v-flex>
          </v-layout>
          <v-layout style="height:50px;" align-center>
            <v-flex class="primary--text caption font-weight-bold">
              This team has enough GC in the bank, and will get auto renewed.
            </v-flex>
          </v-layout>
        </v-layout>
      </v-container>
    </v-card>
    <mtaTeamBank />
    <mtaTeamMembers />
  </v-layout>
</template>
<script>
import mtaTeamMembers from '@/components/mta/mtaTeamMembers'
import mtaTeamBank from '@/components/mta/mtaTeamBank'
export default {
  components: {
    mtaTeamMembers,
    mtaTeamBank

  },
  data() {
    return {
      leaveTeamDialog: false,
      editTeamDialog: false,
      currentTeam: {
        name: 'Name Of Team xx',
        ID: '10',
        avatar: 'https://forums.mrgreengaming.com/uploads/monthly_2018_02/10568889_569147783191250_6509659335854153193_n.jpg.24a083205226e19feed8303cdc9b4d94.jpg',
        owner: 'KaliBwoy',
        tag: 'TAG-',
        members: '30',
        created: 'July 11, 2012',
        bank: 5036,
        expire: '3 Days 30 Minutes'
      }
    }
  },
  methods: {

  }
}
</script>
