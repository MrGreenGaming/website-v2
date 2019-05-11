
<template>
  <v-card flat>
    <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
      <v-icon>account_balance</v-icon>
      <v-toolbar-title class="subheading ml-2">
        GreenCoins Transfer
      </v-toolbar-title>
    </v-toolbar>

    <v-stepper v-model="e6" vertical>
      <v-stepper-step :complete="e6 > 1" step="1">
        Select recipient (Who?)
        <small>Double check if the right member is chosen</small>
      </v-stepper-step>

      <v-stepper-content step="1">
        <v-card flat class="mb-5">
          <v-layout column>
            <v-layout row>
              <v-img class="mr-2" src="https://mrgreengaming.com/forums/uploads/monthly_2018_05/Liverpool.thumb.jpg.8e52e4ebc260503396e0e70eb73ac929.jpg" contain max-width="75px" max-height="75px" />
              <v-layout column>
                <span class="subheading font-weight-bold">Name: Cena</span>
                <span class="body-1">Group: Owner</span>
                <span class="body-1">Member ID: 14817</span>
              </v-layout>
            </v-layout>
            <v-btn dark small style="width:170px;" class="px-0 mx-0 mb-3">
              Remove Recipient
            </v-btn>
          </v-layout>
        </v-card>
        <v-btn class="mx-0" color="primary" @click="e6 = 2">
          Continue
        </v-btn>
      </v-stepper-content>

      <v-stepper-step :complete="e6 > 2" step="2">
        GreenCoins Amount (How Much?)
      </v-stepper-step>

      <v-stepper-content step="2">
        <v-card flat class="mb-2">
          <v-text-field
            label="GreenCoins Amount"
            type="number"
            outline
          />
        </v-card>
        <v-btn class="mx-0" color="primary" @click="e6 = 3">
          Continue
        </v-btn>
        <v-btn flat @click="e6 = 1">
          Cancel
        </v-btn>
      </v-stepper-content>

      <v-stepper-step :complete="e6 > 3" step="3">
        Message (optional)
      </v-stepper-step>

      <v-stepper-content step="3">
        <v-card flat>
          <v-textarea
            auto-grow
            outline
            type="text"
            counter="50"
            maxlength="50"
            color="primary"
            label="Message"
            rows="2"
          />
        </v-card>
        <v-btn class="mx-0" color="primary" @click="e6 = 4">
          Continue
        </v-btn>
        <v-btn flat @click="e6 = 1">
          Cancel
        </v-btn>
      </v-stepper-content>

      <v-stepper-step step="4">
        Review Transaction
      </v-stepper-step>
      <v-stepper-content step="4">
        <v-card flat class="mb-4">
          <v-layout wrap>
            <v-flex xs12 sm12 md4 class="mt-3">
              <v-layout column>
                <h2 class="mb-3">
                  Send To:
                </h2>
                <v-layout row>
                  <v-img class="mr-2" src="https://mrgreengaming.com/forums/uploads/monthly_2018_05/Liverpool.thumb.jpg.8e52e4ebc260503396e0e70eb73ac929.jpg" contain max-width="75px" max-height="75px" />
                  <v-layout column>
                    <span class="subheading font-weight-bold">Name: Cena</span>
                    <span class="body-1">Group: Owner</span>
                    <span class="body-1">Member ID: 14817</span>
                  </v-layout>
                </v-layout>
              </v-layout>
              <v-divider class="mt-4 hidden-sm-and-up" />
            </v-flex>

            <v-flex xs12 sm12 md4 class="mt-3">
              <h2 class="mb-3">
                Amount:
              </h2>
              <h2>1000 GC</h2>
              <v-divider class="mt-4 hidden-sm-and-up" />
            </v-flex>

            <v-flex xs12 sm12 md4 class="mt-3">
              <h2 class="mb-3">
                Message:
              </h2>
              <v-textarea
                solo
                label="Message"
                value="This textarea will display the message typed previously"
                readonly
              />
            </v-flex>
          </v-layout>
        </v-card>
        <v-btn class="mx-0" color="primary" @click="e6 = 1">
          Send GreenCoins
        </v-btn>
        <v-btn flat @click="e6 = 1">
          Cancel
        </v-btn>
      </v-stepper-content>
    </v-stepper>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      e6: 1
    }
  }
}
</script>
