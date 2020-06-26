/* eslint-disable */
import {namespace} from 'vuex-class';
import {IVRequestOptions} from "./IEntity";
import {IObject} from "ts-utils2";
import {Observable} from "rxjs";

export {IObject, IObjectIndexer} from 'ts-utils2';
export {Observer, Subject} from 'rxjs';

const crudModule = namespace('crud');

export {IVRequestOptions, IVParam} from './IEntity';
export {
  IApiConfig, IRouteConfig, IAction,
  IApiRoute, IApiRouteConfig, IEntityFunc,
  IEntityObjFunc
} from './IApiRouteConfig';

export {Entity} from './Entity';
export {register, mapStore} from './storeCrud';
export const Func = crudModule.Action;
export const Var = crudModule.State;
