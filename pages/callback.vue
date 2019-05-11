<template>
  <no-ssr>
    <v-container class="callbackContainer" flat style="min-height:1000px;">
      <v-layout class="mt-3" column align-center justify-center>
        <h1>Logging In...</h1>
        <v-progress-circular
          class="mt-3"
          :width="5"
          :size="70"
          color="primary"
          indeterminate
        />
      </v-layout>
    </v-container>
  </no-ssr>
</template>

<style scoped>
.callbackContainer {
	min-height: 1000px;
}
</style>
