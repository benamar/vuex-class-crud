<template>
  <div class="hello">
    shows=
    <div v-for="show in shows">
      {{ show.show.name }}
      <img width=150 :src="show.show.image.original" >
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Func, IContent, Var } from 'vuex-class-crud';
import { IObject } from 'ts-utils2';

export type IEntityFunc<O> = (content?: IContent) => Promise<O>;

@Component
export default class Show extends Vue {
  //@Prop() private msg!: string;
  @Prop({ type: String, required: true }) public name!: string;
  @Var public shows!: IObject;
  @Func public fetchShows!: IEntityFunc<IObject>;

  public async mounted() {
    const q = this.name;
    const query = { q };
    await this.fetchShows({ query });
  }
}
</script>
