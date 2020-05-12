<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <Show name="batman" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Show from '@/components/Show.vue';
@Component({
  components: { Show },
})
export default class HelloCrudWorld extends Vue {
  @Prop() private msg!: string;
  public async created() {
    console.log('==========> $store', this.$store);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
