import RequestHandler from './RequestHandler';
import { capitalize, IObject, waitObjectParamSet } from 'ts-utils2';
import {  IApiRouteConfig } from './IApiRouteConfig';
import { IContent, IParam } from './IEntity';
import {Store} from "vuex";
export const version = '1.0';
export class Entity implements IObject {
  private readonly suffix: string;

  private readonly routeHeaders: any;
  private readonly apiHeaders: any;
  public state: any;
  private store: Store<any>;
  public static formattedError(e: {
    response: { data: any; status: any };
    message: any;
  }) {
    if (e.response.status === 404) {
      return { data: e.message, status: 404 };
    }
    return {
      data: (e.response && e.response.data) || e.message,
      status: (e.response && e.response.status) || 400,
    };
  }

  public items: any;
  public readonly name: string;
  private readonly urlPath?: string;
  private reqHandler: RequestHandler;
  private hasMoreItems: boolean;
  private accessToken: any = null;
  private cache: { [name: string]: string } = {};
  private hooks: { afterRequest?: (content?: IObject) => void, hasHooks?: boolean} = {hasHooks: false};
  private readonly fetchFormat: any;
  private readonly prefix?: string;
  private pageId: number;
  private readonly location: string = '';
  private readonly needAuth = false;
  private withHeaders: any;
  private moduleName = 'crud/';

  get headers() {
    const routeHeaders = typeof this.routeHeaders === 'function' ? this.routeHeaders(this) : this.routeHeaders;
    const apiHeaders = typeof this.apiHeaders === 'function' ? this.apiHeaders(this) : this.apiHeaders;
    return { ...routeHeaders, ...apiHeaders };
  }
  constructor(apiConfig: IApiRouteConfig, store: any, name: string) {
    const apiConf = apiConfig.config;
    this.name = name;
    const routeConfig = apiConfig.routes[name];
    this.store = store;
    this.urlPath = routeConfig.api;
    this.location = routeConfig.location || apiConf && apiConf.location;
    this.withHeaders = routeConfig.withHeaders;
    this.fetchFormat = routeConfig.fetchFormat;
    this.needAuth = typeof routeConfig.needAuth !== 'undefined' ? routeConfig.needAuth : false;
    this.prefix = typeof routeConfig.prefix !== 'undefined' ? routeConfig.prefix : apiConf && apiConf.prefix;
    this.suffix = typeof routeConfig.suffix !== 'undefined' ? routeConfig.suffix : '';
    const { prefix, location, withHeaders } = this;
    this.reqHandler = new RequestHandler({ prefix, location, withHeaders }, store, this.moduleName);
    this.hasMoreItems = true;
    this.pageId = 0;
    this.hooks.afterRequest = apiConf && apiConf.hooks && apiConf.hooks.afterRequest;
    this.routeHeaders = routeConfig.headers;
    this.apiHeaders = apiConf && apiConf.headers;
    // this.fetch().then();
  }

  public setAccessToken(token: string | undefined, authKey='Bearer') {
    this.accessToken = token;
    this.reqHandler.setAccessToken(token, authKey);
  }

  public async fetch(content: IContent = {}): Promise<object> {
    let url = '';
    try {
      this.items = {};
      // console.log('calling fetch with', content);
      if (this.accessToken === null && this.needAuth) {
        console.log('typeof waitObjectParamSet', typeof waitObjectParamSet);
        const res = await waitObjectParamSet(this, 'accessToken', 30);
        this.store.commit(this.moduleName + 'set' + capitalize(this.name), this.items);
        if (!res) {
          throw Error('Token is not defined');
        }
      } else {
        // console.log('no need reauth');
      }
      let { params, query, refresh, errorCallback, headers } = content;
      url = this.formatUrl(params, query);
      // console.log('fetch', url);
      if (this.cache[url] && !refresh) {
        this.items = this.cache[url];
      } else {
        headers = { ...this.headers, ...headers };
        // console.log('---> fetch call ', url, 'with headers', this.headers);
        const response = await this.reqHandler.execute(
            { method: 'get', url, headers, errorCallback, hooks: this.hooks });
        // console.log('Entity', this.name, 'received ', url, response);
        if (this.fetchFormat) {
          // console.log('format fetch ..');;
          this.items = this.fetchFormat(response);
        } else {
          this.items = response;
        }
        this.items._receivedAt = new Date();
      }
      this.cache[url] = this.items;
      // console.log('commit','set' + capitalize(this.name));
      // store.commit('set' + capitalize(this.name) + 'Success', true);
    } catch (e) {
      // console.error('fetch error', url, e.message);
      console.log('fetch error', url, e);
      // throw e;
      this.items = {};
    }
    this.store.commit(this.moduleName + 'set' + capitalize(this.name), this.items);
    return this.items;
  }

  public formatUrl(params?: IParam, queryFields?: IObject): string {
    // console.log('formatUrl');
    let url = this.urlPath || '';
    let queryString = '';
    try {
      if (params) {
        Object.keys(params).forEach((param: string) => {
          // @ts-ignore
          const value = params[param];
          url = url.replace(`{${param}}`, value);
          // console.log("replacing", `{${param}}`, value, url);
        });
      }
      if (queryFields) {
        Object.keys(queryFields).forEach(key => {
          // console.log('queryFields', key, queryFields[key]);
          if (queryFields[key]) {
            if (queryString) {
              queryString += '&';
            }
            if (typeof queryFields[key] === 'object' && queryFields[key].hasOwnProperty) {
              queryString += Object.keys(queryFields[key]).map(k =>
                  `${key}[${k}]=${queryFields[key][k]}`).join('&',
              );
            } else {
              queryString += `${key}=${queryFields[key]}`;
            }
          }
        });
      }
      if (queryString) {
        queryString = '?' + queryString;
      }
    } catch (e) {
      console.error('formatUrl error', e);
      throw(new Error('formatUrl error:' + e.message));
    }
    return url + this.suffix + queryString;
  }

  public async create(content: IContent): Promise<object> {
    try {
      // console.log("creating  newElement params", content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      headers = { ...this.headers, ...headers };
      const response = await this.reqHandler.execute(
          { method: 'post', data, url, headers, errorCallback });
      // console.log('received create ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async put(content: IContent): Promise<object> {
    try {
      // console.log("creating  newElement params", content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      headers = { ...this.headers, ...headers };
      const response = await this.reqHandler.execute(
          { method: 'put', data, url, headers, errorCallback });
      // console.log('received put ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async patch(content: IContent): Promise<object> {
    try {
      // console.log("creating  newElement params", content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      headers = { ...this.headers, ...headers };
      const response = await this.reqHandler.execute(
          { method: 'patch', data, url, headers, errorCallback });
      // console.log('received put ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async remove(content: IContent): Promise<object> {
    try {
      let { params, query, errorCallback, headers } = content;
      const url = this.formatUrl(params, query);
      headers = { ...this.headers, ...headers };
      const response = await this.reqHandler.execute(
          { method: 'delete', url, headers, errorCallback });
      // console.log("received delete ", this.url, " result", content,'write to',"set" + capitalize(this.name));
      return { data: response, status: 200 };
    } catch (e) {
      return Entity.formattedError(e);
    }
  }
}

export default Entity;
