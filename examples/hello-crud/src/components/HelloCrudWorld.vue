<template>
  <div class="hello">
    <h1>{{ msg }}</h1>

    <div class="show ">
      <img width="150" :src="walterWhite.img" class="float-left" />
      <div class="summary w-100">
        <h2>{{ walterWhite.name }}</h2>
        <p>birthday: {{ walterWhite.birthday }}</p>
        <p>occupation: {{ walterWhite.occupation }}</p>
      </div>
    </div>

    <div class="show">
      <div
        v-for="show in shows"
        v-bind:key="show.show.id"
        class="show float-left"
      >
        <img width="150" :src="show.show.image.original" class="float-left" />
        <div class="summary">
          <h2>{{ show.show.name }}</h2>
          {{ show.show.summary }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import {
  Func,
  IEntityFunc,
  IEntityObjFunc,
  Var,
  IObject,
} from '../../../../dist';

@Component
export default class HelloCrudWorld extends Vue {
  @Prop() private msg!: string;
  @Var shows!: IObject;
  @Var manga!: IObject;
  @Var walterWhite!: IObject;
  @Func fetchWalterWhite!: IEntityObjFunc;
  @Func fetchShows!: IEntityFunc<IObject>;
  @Func fetchManga!: IEntityFunc<IObject>;

  public async created() {
    const query = { q: 'batman' };
    console.log('waiting breaking bad result');
    const messages = await this.fetchWalterWhite();
    console.log('breaking bad result', messages);
    console.log('first call received, now fetching shows');
    await this.fetchShows({ query });
    await this.fetchManga({ variables: {id:15125} });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.summary,
.show,
.float-left {
  display: block;
  float: left;
  position: relative;
}
.summary {
  width: 80%;
}
.show {
  margin-bottom: 20px;
  margin-top: 20px;
  background: aliceblue;
  width: 100%;
}
</style>
