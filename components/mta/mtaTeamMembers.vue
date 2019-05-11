<template>
  <v-card class="mb-3">
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-toolbar-title class="subheading ml-0">
        Team Members
      </v-toolbar-title>
    </v-toolbar>
    <v-container fluid class="pb-1">
      <v-card flat>
        <v-card-title>
          <!-- <v-spacer></v-spacer> -->
          <v-text-field
            v-model="search"
            append-icon="search"
            label="Search Member"
            single-line
            hide-details
          />
        </v-card-title>
        <v-data-table
          :headers="headers"
          :items="members"
          :search="search"
          :disable-initial-sort="true"
        >
          <template slot="items" slot-scope="props">
            <td class="font-weight-bold">
              {{ props.item.name }}
            </td>
            <td class="">
              {{ props.item.role }}
            </td>
            <td class="">
              {{ unixToDate(props.item.joindate) }}
            </td>
            <td class="">
              <div v-if="props.item.role == 'Officer'">
                <v-tooltip top>
                  <v-btn slot="activator" small style="height:20px;min-width:70px;" class="caption px-2">
                    Demote
                  </v-btn>
                  Demote to rank "Member"
                </v-tooltip>

                <v-btn small style="height:20px;min-width:70px;" class="caption px-2">
                  Kick
                </v-btn>
              </div>
              <div v-if="props.item.role == 'Member'">
                <v-tooltip top>
                  <v-btn slot="activator" small style="height:20px;min-width:70px;" class="caption px-2">
                    Promote
                  </v-btn>
                  Promote to rank "Officer"
                </v-tooltip>

                <v-btn small style="height:20px;min-width:70px;" class="caption px-2">
                  Kick
                </v-btn>
              </div>
            </td>
          </template>
          <v-alert slot="no-results" :value="true" color="error" icon="warning">
            Your search for "{{ search }}" found no results.
          </v-alert>
        </v-data-table>
      </v-card>
    </v-container>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      search: '',
      headers: [
        { text: 'Member', align: 'left', value: 'name' },
        { text: 'Role', value: 'role' },
        { text: 'Joined', value: 'joindate' },
        { text: 'Actions', value: 'actions', sortable: false, width: '230px' }
      ],
      members: [
        { name: 'KaliBwoy', role: 'Owner', joindate: '1534525521' },
        { name: 'Cena', role: 'Officer', joindate: '1524524521' },
        { name: 'Stig', role: 'Officer', joindate: '1514523521' },
        { name: 'Member 1', role: 'Member', joindate: '1504535521' },
        { name: 'Member 2', role: 'Member', joindate: '1534525521' },
        { name: 'Member 3', role: 'Member', joindate: '1534515521' },
        { name: 'Member 4', role: 'Member', joindate: '1534425521' },
        { name: 'Member 5', role: 'Member', joindate: '1534325521' },
        { name: 'Member 6', role: 'Member', joindate: '1534225521' },
        { name: 'Member 7', role: 'Member', joindate: '1534125521' },
        { name: 'Member 8', role: 'Member', joindate: '1534025521' },
        { name: 'Member 9', role: 'Member', joindate: '1533525521' },
        { name: 'Member 10', role: 'Member', joindate: '1534525521' },
        { name: 'Member 11', role: 'Member', joindate: '1533525521' },
        { name: 'Member 12', role: 'Member', joindate: '1532525521' },
        { name: 'Member 13', role: 'Member', joindate: '1531525521' },
        { name: 'Member 14', role: 'Member', joindate: '1530525521' },
        { name: 'Member 15', role: 'Member', joindate: '1534025521' },
        { name: 'Member 16', role: 'Member', joindate: '1534505521' },
        { name: 'Member 17', role: 'Member', joindate: '1534025521' },
        { name: 'Member 18', role: 'Member', joindate: '1534505521' },
        { name: 'Member 19', role: 'Member', joindate: '1534520521' },
        { name: 'Member 20', role: 'Member', joindate: '1534525021' },
        { name: 'Member 21', role: 'Member', joindate: '1534520521' },
        { name: 'Member 22', role: 'Member', joindate: '1534525021' },
        { name: 'Member 23', role: 'Member', joindate: '1534520521' },
        { name: 'Member 24', role: 'Member', joindate: '1534525021' }

      ]
    }
  },
  methods: {
    unixToDate: function (stamp) {
      if (stamp) {
        const date = new Date(stamp * 1000)
        return date.toLocaleDateString()
      } else {
        return ''
      }
    }
  }
}
</script>
