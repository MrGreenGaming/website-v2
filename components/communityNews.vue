<template>
  <div v-if="news">
    <v-card v-for="item in trimmedNews" :key="item.id" class="mb-3 communityNewsCard">
      <v-toolbar flat color="primary" dark dense class="slim-toolbar-padding">
        <v-icon class="mr-1">
          event_note
        </v-icon>
        <v-toolbar-title class="subheading ml-0">
          NEWS: {{ item.title }}
        </v-toolbar-title>
      </v-toolbar>
      <v-container class="pb-5" style="position:relative; overflow-y:hidden; overflow-x:hidden;">
        <div class="communityNewsContent" v-html="formatPostContent(item.firstPost.content)" />

        <v-card v-if="item.poll" flat color="px-2 py-2">
          <h3>Poll: {{ item.poll.questions[0].question }}</h3>
          <v-layout column>
            <span v-for="(index, result) in item.poll.questions[0].options" :key="index">
              <b>{{ result }}:</b>
              {{ item.poll.questions[0].options[result] }}
              <v-divider />
            </span>
          </v-layout>
        </v-card>
        <div class="communityNewsReadMoreGradient" />
      </v-container>
      <v-card flat>
        <v-layout align-center justify-center>
          <v-btn dark color="primary" centered :href="item.url">
            Read More
          </v-btn>
        </v-layout>
      </v-card>
      <v-card flat height="50px" class="px-4">
        <v-divider class="mt-4" />
        <v-layout justify-space-between align-center>
          <span>
            By:
            <a
              :href="item.firstPost.author.profileUrl"
              target="_blank"
              style="text-decoration: none;"
              v-html="item.firstPost.author.formattedName"
            />
            - {{ parseDate(item.firstPost.date) }}
          </span>
          <v-spacer />
          <v-chip>
            <v-avatar>
              <v-icon>remove_red_eye</v-icon>
            </v-avatar>
            {{ item.views }}
          </v-chip>
          <v-chip>
            <v-avatar>
              <v-icon>mode_comment</v-icon>
            </v-avatar>
            {{ item.posts }}
          </v-chip>
        </v-layout>
      </v-card>
    </v-card>
  </div>
</template>
<script>
export default {
  props: {
    news: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      maxNewsItems: 3
    }
  },
  computed: {
    trimmedNews: function () {
      return this.news.slice(0, this.maxNewsItems)
    }
  },
  mounted() {},
  methods: {
    formatPostContent(content) {
      return content
      // return this.replaceAll(content, "<img", "<v-img");
    },
    replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace)
    },
    parseDate(date) {
      const parsed = new Date(Date.parse(date))
      return parsed.toLocaleDateString()
    }
  }
}
</script>
<style scoped>
.communityNewsCard {
	overflow-y: hidden;
	overflow-x: hidden;
}
.communityNewsContent {
	max-height: 600px;
}

.communityNewsReadMoreGradient {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 100%;
	height: 15%;
	background: -moz-linear-gradient(
		top,
		rgba(255, 255, 255, 0) 0%,
		rgba(255, 255, 255, 1) 70%,
		rgba(255, 255, 255, 1) 71%
	);
	background: -webkit-linear-gradient(
		top,
		rgba(255, 255, 255, 0) 0%,
		rgba(255, 255, 255, 1) 70%,
		rgba(255, 255, 255, 1) 71%
	);
	background: linear-gradient(
		to bottom,
		rgba(255, 255, 255, 0) 0%,
		rgba(255, 255, 255, 1) 70%,
		rgba(255, 255, 255, 1) 71%
	);
	filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#00ffffff', endColorstr='#ffffff',GradientType=0 );
}
</style>
