# vuex-class-crud
make rest api or graphQL call very easy
##installation
```
yarn add vuex-class-crud
```
or
```
npm install vuex-class-crud
```
## Usage
1) describe your api in a very simple format
create file apiRoutes.ts and define your routes like this.
```typescript
import { IApiRouteConfig } from 'vuex-class-crud';
const apiRoutes: IApiRouteConfig = {
  config: {
    location: 'https://api.tvmaze.com',
    // prefix:'public', // to prefix all routes 
    // headers: function() { return {'x-client':'MYCLIENT'}} // to add a header
    // hooks:  {afterRequest:(response: IObject) => {/* do something with each received response, headers*/}}
  },
  routes: {
    shows: {
      api: '/search/shows',
      initial: {},
    },
    show: {
      api: '/shows/{id}',
      initial: {},
        // to modify received body
      fetchFormat: (body: any) => {
          return {...body, receivedAt: new Date()}
      }
    },
  },
};
export default apiRoutes;
``` 

2) register
in your store/index.ts, register your routes
```typescript
import Vuex from 'vuex';
import {  register } from 'vuex-class-crud';
import apiRoutes from './apiRoutes';
//define here your own store
const yourStore = {}
Vue.use(Vuex);
const store = new Vuex.Store({...yourStore});
register(store, apiRoutes);
```
3) use and enjoy your store and action/mutation functions as a simple class method.
vuex-class-crud will create easy to use crud functions for all api endpoints
you have just to declare the ones you want to use like this.

 ```vue
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
import { Func, Var, IEntityFunc, IObject} from 'vuex-class-crud';

@Component
export default class Show extends Vue {
  //@Prop() private msg!: string;
  @Prop({ type: String, required: true }) public name!: string;
  @Var public shows!: IObject;
  @Func public fetchShows!: IEntityFunc<IObject>;
  @Func public fetchShow!: IEntityFunc<IObject>;
  @Func public deleteShow!: IEntityFunc<IObject>;
  @Func public addShow!: IEntityFunc<IObject>;
  //...
  public async mounted() {
    const q = this.name;
    const query = { q };
    await this.fetchShows({ query });
  }
}
</script>

```
You may use your endpoint data interface instead of IObject wich is a generic dictionary interface.

## creating a simple example from scratch with vue cli
`
vue create hello-crud
`
use manual select to get the following choices 
```>
? Please pick a preset: Manually select features.
? Check the features needed for your project: Babel, TS, Router, Vuex, Linter.
? Use class-style component syntax? Yes
? Use Babel alongside TypeScript (required for modern mode, auto-detected polyfills, transpiling JSX)? Yes
? Use history mode for router? (Requires proper server setup for index fallback in production) No
? Pick a linter / formatter config: Prettier
? Pick additional lint features: (Press <space> to select, <a> to toggle all, <i> to invert selection)Lint on save
? Where do you prefer placing config for Babel, ESLint, etc.? In dedicated config files_
```

`
yarn add vuex-class-crud
`
check the example for more help

## Advanced usage
you can increase crud functions to be more powerful and centralised code. 
- fetchFormat -
 json remapping before the endpoint result is dispatch to object listeners. 
- add hooks to compute all received endpoint responses
- use custom headers