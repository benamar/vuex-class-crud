/* eslint-disable */
import {namespace} from 'vuex-class';

const crudModule = namespace('crud');

export {IContent, IParam} from './IEntity';
export {
    IApiConfig, IRouteConfig, IAction,
    IApiRoute, IApiRouteConfig, IEntityFunc,
    IEntityObjFunc
} from './IApiRouteConfig';

export {Entity} from './Entity';
export {register} from './storeCrud';
// export {IRequestHandlerConf, IRequestHandler} from './RequestHandler';
export const Func = crudModule.Action;
export const Var = crudModule.State;
