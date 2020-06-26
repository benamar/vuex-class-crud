import { capitalize, IObject, waitObjectParamSet } from 'ts-utils2';
import { IApiRouteConfig, IRouteConfig } from './IApiRouteConfig';
import { IVRequestOptions, IVParam } from './IEntity';
import { CommitOptions, Store } from 'vuex';
import { Observer, Subject } from 'rxjs';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const version = '1.0';

export class Entity implements IObject {
  private readonly suffix: string;

  private readonly routeHeaders: any;
  private readonly apiHeaders: any;
  public state: any;
  private store!: Store<any>;
  private routeConfig: IRouteConfig;

  private subject: any = new Subject();
  // eslint-disable-next-line
  public observable: Observer<any> = this.subject.asObservable();
  private readonly afterRequest: ((content?: IObject) => void) | undefined;
  private readonly beforeRequest: ((content?: IObject) => void) | undefined;
  private gql: string;

  public static formattedError (e: {
    response: { data: any; status: any };
    message: any;
  }) {
    if (e.response.status === 404) {
      return { data: e.message, status: 404 };
    }
    return {
      data: (e.response && e.response.data) || e.message,
      status: (e.response && e.response.status) || 400
    };
  }

  public items: any;
  public readonly name: string;
  private readonly urlPath?: string;
  private readonly baseUrl: string;
  private hasMoreItems: boolean;
  private accessToken: any = null;
  private authKey = 'Bearer';
  private cache: { [name: string]: string } = {};
  private readonly fetchFormat: any;
  private readonly prefix?: string;
  private pageId: number;
  private readonly location: string = '';
  private readonly needAuth = false;
  private readonly withHeaders: any;
  private moduleName = 'crud/';
  private readonly client: AxiosInstance;

  async getHeaders () {
    const routeHeaders =
      typeof this.routeHeaders === 'function'
        ? await this.routeHeaders(this)
        : this.routeHeaders;
    const apiHeaders =
      typeof this.apiHeaders === 'function'
        ? await this.apiHeaders(this)
        : this.apiHeaders;
    return { ...routeHeaders, ...apiHeaders };
  }

  constructor (apiConfig: IApiRouteConfig, name: string) {
    const apiConf = apiConfig.config;
    this.name = name;
    const routeConfig = apiConfig.routes[name];
    this.urlPath = routeConfig.api;
    this.location = routeConfig.location || (apiConf && apiConf.location);
    this.withHeaders = routeConfig.withHeaders;
    this.fetchFormat = routeConfig.fetchFormat;
    this.gql = routeConfig.gql;
    this.needAuth =
      typeof routeConfig.needAuth !== 'undefined'
        ? routeConfig.needAuth
        : false;
    this.prefix =
      typeof routeConfig.prefix !== 'undefined'
        ? routeConfig.prefix
        : apiConf && apiConf.prefix;
    this.suffix =
      typeof routeConfig.suffix !== 'undefined' ? routeConfig.suffix : '';
    const { prefix, location, withHeaders } = this;
    this.hasMoreItems = true;
    this.pageId = 0;
    this.afterRequest = apiConf && apiConf.hooks && apiConf.hooks.afterRequest;
    this.afterRequest =
      (routeConfig.hooks && routeConfig.hooks.afterRequest) ||
      this.afterRequest;
    this.beforeRequest =
      apiConf && apiConf.hooks && apiConf.hooks.beforeRequest;
    this.beforeRequest =
      (routeConfig.hooks && routeConfig.hooks.beforeRequest) ||
      this.beforeRequest;
    this.routeHeaders = routeConfig.headers;
    this.apiHeaders = apiConf && apiConf.headers;
    this.routeConfig = routeConfig;
    // v2;

    this.baseUrl =
      (apiConf && apiConf.location
        ? apiConf.location.replace(/\/$/, '')
        : process.env.VUE_APP_BACKEND_HOST) +
      '/' +
      (this.prefix ? this.prefix : '');
    this.baseUrl = this.baseUrl
      .replace('//', '/')
      .replace('http:/', 'http://')
      .replace('https:/', 'https://');
    this.client = axios.create({
      baseURL: this.baseUrl
    });
  }

  public setStore (store: any) {
        this.store = store;
       this.state = store.state;
  }

  private commit (type: string, payload?: any, options?: CommitOptions): void {
    return this.store.commit(this.moduleName + type, payload, options);
  }



  public setAccessToken (token: string | undefined, authKey = 'Bearer') {
    this.accessToken = token;
    this.authKey = authKey;
    // this.reqHandler.setAccessToken(token, authKey);
  }

  private async fetch (requestOptions: IVRequestOptions = {}): Promise<IObject> {
    let url = '';
    try {
      this.items = {};
      if (this.accessToken === null && this.needAuth) {
        // console.log('waiting access token');
        const res = await waitObjectParamSet(this, 'accessToken', 30);
        this.commit('set' + capitalize(this.name), this.items);
        if (!res) {
          throw Error('Token is not defined');
        }
      } else {
        // console.log('no need reauth');
      }
      let {
        params,
        query,
        refresh,
        errorCallback,
        headers,
        variables
      } = requestOptions;
      url = this.formatUrl(params, query);
      // console.log('fetch url', url);
      if (this.cache[url] && !refresh) {
        this.items = this.cache[url];
      } else {
        const apiHeaders = await this.getHeaders();
        headers = { ...apiHeaders, ...headers };
        // console.log('---> fetch call ', url, 'with apiHeaders', apiHeaders);
        let response;
        if (this.gql) {
          const data = {
            variables,
            query: this.gql
          };
          response = await this.execute({
            method: 'post',
            data,
            url,
            headers,
            errorCallback
          });
        } else {
          response = await this.execute({
            method: 'get',
            url,
            headers,
            errorCallback
          });
        }
        // console.log('Entity', this.name, 'received ', url, response);
        if (this.fetchFormat) {
          // console.log('format fetch ..');
          this.items = this.fetchFormat(response);
        } else {
          this.items = response;
        }
        this.items._receivedAt = new Date();
      }
      this.cache[url] = this.items;
      // console.log('commit', 'set' + capitalize(this.name));
      // store.commit('set' + capitalize(this.name) + 'Success', true);
    } catch (e) {
      // console.error('fetch error', url, e.message);
      console.log('fetch error', url, e);
      // throw e;
      this.items = {};
    }
    this.subject.next(this.items);
    this.commit('set' + capitalize(this.name), this.items);
    return this.items;
  }

  public formatUrl (params?: IVParam, queryFields?: IObject): string {
    // console.log('formatUrl');
    let url = this.urlPath || '';
    let queryString = '';
    try {
      if (params) {
        Object.keys(params).forEach((param: string) => {
          // @ts-ignore
          const value = params[param];
          url = url.replace(`{${param}}`, value);
          // console.log('replacing', `{${param}}`, value, url);
        });
      }
      if (queryFields) {
        Object.keys(queryFields).forEach(key => {
          // console.log('queryFields', key, queryFields[key]);
          if (queryFields[key]) {
            if (queryString) {
              queryString += '&';
            }
            if (
              typeof queryFields[key] === 'object' &&
              queryFields[key].hasOwnProperty
            ) {
              queryString += Object.keys(queryFields[key])
                .map(k => `${key}[${k}]=${queryFields[key][k]}`)
                .join('&');
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
      throw new Error('formatUrl error:' + e.message);
    }
    return url + this.suffix + queryString;
  }

  public async create (content: IVRequestOptions): Promise<IObject> {
    try {
      // console.log('creating  newElement params', content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      const apiHeaders = await this.getHeaders();
      headers = { ...apiHeaders, ...headers };
      const response = await this.execute({
        method: 'post',
        data,
        url,
        headers,
        errorCallback
      });
      // console.log('received create ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async put (content: IVRequestOptions): Promise<IObject> {
    try {
      // console.log('creating  newElement params', content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      const apiHeaders = await this.getHeaders();
      headers = { ...apiHeaders, ...headers };
      const response = await this.execute({
        method: 'put',
        data,
        url,
        headers,
        errorCallback
      });
      // console.log('received put ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async patch (content: IVRequestOptions): Promise<IObject> {
    try {
      // console.log('creating  newElement params', content.params);
      let { params, query, errorCallback, headers, body: data } = content;
      data = data || content;
      const url = this.formatUrl(params, query);
      const apiHeaders = await this.getHeaders();
      headers = { ...apiHeaders, ...headers };
      const response = await this.execute({
        method: 'patch',
        data,
        url,
        headers,
        errorCallback
      });
      // console.log('received put ', url, response);
      return { data: response, status: 200 };
    } catch (e) {
      console.error(e);
      return Entity.formattedError(e);
    }
  }

  public async remove (content: IVRequestOptions): Promise<IObject> {
    try {
      let { params, query, errorCallback, headers } = content;
      const url = this.formatUrl(params, query);
      const apiHeaders = await this.getHeaders();
      headers = { ...apiHeaders, ...headers };
      const response = await this.execute({
        method: 'delete',
        url,
        headers,
        errorCallback
      });
      // console.log("received delete ", this.url, " result", content,'write to',"set" + capitalize(this.name));
      return { data: response, status: 200 };
    } catch (e) {
      return Entity.formattedError(e);
    }
  }

  public async execute (_config: IVRequestOptions): Promise<IObject> {
    // inject the accessToken for each request
    const Authorization = this.accessToken
      ? `${this.authKey} ${this.accessToken}`
      : undefined;
    const headers = Authorization
      ? { Authorization, ..._config.headers }
      : _config.headers;
    const config = { ..._config, headers };
    // console.log('received headers', config.headers,
    //  'reqHandler calling ', config.url, 'with params :', config);
    try {
      // console.log('check hooks', this.hooks.afterRequest);
      if (this.beforeRequest) {
        await this.beforeRequest(config);
      }
      // console.log('REQUEST OPTION', config);
      const response = await this.client(<AxiosRequestConfig>config);
      // console.log('check hooks', this.hooks.afterRequest);
      if (this.afterRequest) {
        this.afterRequest(response);
      }
      // console.log('REQUEST RESPONSE', response);
      const { data, headers } = response;
      if (this.withHeaders) {
        return { data, headers, req: response };
      }
      return data;
    } catch (e) {
      // check if: User not registered
      const { response } = e;
      if (response) {
        const { data, status, statusText } = response;
        if (!data) {
          this.commit('setUnauthorizedUser', true);
        } else {
          const { code, message } = data;
          if (data === 'Authentication Failed: User not registered') {
            const message =
              'This account is not authorized or not yet registred for this action';
            this.commit('setUnauthorizedUser', { message, code, status });
          }

          if (code === 500) {
            console.log('set error event setLastErrorMessage', {
              message,
              code,
              status
            });
            this.commit('setLastErrorMessage', { message, code, status });
          }
          if (status === 500) {
            console.log('set error event setLastErrorMessage', {
              message,
              code,
              status
            });
            this.commit('setLastErrorMessage', { message: statusText, status });
          }

          if (
            (status === 401 && statusText.indexOf('expired') !== -1) ||
            (code === 401 && message.indexOf('expired'))
          ) {
            const message = 'Session timed out';
            console.log('setUnauthorizedUser', { message, code, status });
            this.commit('setUnauthorizedUser', true);
          }
          if (code === 403 && message === 'error.jwt.auth.info_not_found') {
            const message =
              'This account is not authorized or not yet registred for this action';
            this.commit('setUnauthorizedUser', { message, code, status });
          }

          if (typeof config.errCallback === 'function') {
            config.errCallback(data);
          }
        }
      } else {
        const message = 'serveur not responding!';
        this.commit('setUnauthorizedUser', { message, code: 999, status });
      }

      throw e;
    }
  }
}

export default Entity;
