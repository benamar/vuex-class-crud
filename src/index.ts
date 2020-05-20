/* eslint-disable */
import {namespace} from 'vuex-class';
import {IVRequestOptions} from "./IEntity";
import {IObject} from "ts-utils2";
import {Observable} from "rxjs";
export { IObject, IObjectIndexer } from 'ts-utils2';
export {Observer, Subject} from 'rxjs';

import { createDecorator } from 'vue-class-component'

// Declare Log decorator.
export const Observe = createDecorator((options, key) => {
    // Keep the original method for later.
    const originalMethod = options && options.methods && options.methods[key];

    // Wrap the method with the logging logic.
    if(options && options.methods ){
        options.methods[key] = function wrapperMethod(...args: any[]) {
            // Print a log.
            console.log(`Invoked: ${key}(`, ...args, ')');
            // Invoke the original method.
            // @ts-ignore
            originalMethod && originalMethod.apply(this, args);
        }
    }
});

export type IObservableFunc = () => Promise<Observable<any>>;

const crudModule = namespace('crud');

export {IVRequestOptions, IVParam} from './IEntity';
export {
    IApiConfig, IRouteConfig, IAction,
    IApiRoute, IApiRouteConfig, IEntityFunc,
    IEntityObjFunc
} from './IApiRouteConfig';

export {Entity} from './Entity';
export {register} from './storeCrud';
export const Func = crudModule.Action;
export const Var = crudModule.State;
