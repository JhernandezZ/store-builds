import { META_KEY, ActionOptions } from '../symbols';
import { Observable } from 'rxjs';
export interface ObjectKeyMap<T> {
    [key: string]: T;
}
export interface StateClass {
    [META_KEY]?: MetaDataModel;
}
export declare type StateKeyGraph = ObjectKeyMap<string[]>;
export interface ActionHandlerMetaData {
    fn: string;
    options: ActionOptions;
    type: string;
}
export interface StateOperations<T> {
    getState(): T;
    setState(val: T): any;
    dispatch(actions: any | any[]): Observable<void>;
}
export interface MetaDataModel {
    name: string;
    actions: ObjectKeyMap<ActionHandlerMetaData[]>;
    defaults: any;
    path: string;
    children: StateClass[];
    instance: any;
}
export declare type SelectFromState = (state: any) => any;
export interface SelectorMetaDataModel {
    selectFromAppState: SelectFromState;
    originalFn: Function;
    containerClass: any;
    selectorName: string;
}
export interface MappedStore {
    name: string;
    actions: ObjectKeyMap<ActionHandlerMetaData[]>;
    defaults: any;
    instance: any;
    depth: string;
}
/**
 * Ensures metadata is attached to the class and returns it.
 *
 * @ignore
 */
export declare function ensureStoreMetadata(target: any): MetaDataModel;
/**
 * Get the metadata attached to the class if it exists.
 *
 * @ignore
 */
export declare function getStoreMetadata(target: any): MetaDataModel;
/**
 * Ensures metadata is attached to the selector and returns it.
 *
 * @ignore
 */
export declare function ensureSelectorMetadata(target: any): SelectorMetaDataModel;
/**
 * Get the metadata attached to the selector if it exists.
 *
 * @ignore
 */
export declare function getSelectorMetadata(target: any): SelectorMetaDataModel;
/**
 * The generated function is faster than:
 * - pluck (Observable operator)
 * - memoize
 *
 * @ignore
 */
export declare function fastPropGetter(paths: string[]): (x: any) => any;
/**
 * Given an array of states, it will return a object graph. Example:
 *    const states = [
 *      Cart,
 *      CartSaved,
 *      CartSavedItems
 *    ]
 *
 * would return:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * @ignore
 */
export declare function buildGraph(stateClasses: StateClass[]): StateKeyGraph;
/**
 * Given a states array, returns object graph
 * returning the name and state metadata. Example:
 *
 *  const graph = {
 *    cart: { metadata }
 *  };
 *
 * @ignore
 */
export declare function nameToState(states: StateClass[]): ObjectKeyMap<StateClass>;
/**
 * Given a object relationship graph will return the full path
 * for the child items. Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const r = {
 *    cart: 'cart',
 *    saved: 'cart.saved',
 *    items: 'cart.saved.items'
 *  };
 *
 * @ignore
 */
export declare function findFullParentPath(obj: StateKeyGraph, newObj?: ObjectKeyMap<string>): ObjectKeyMap<string>;
/**
 * Given a object graph, it will return the items topologically sorted Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const results = [
 *    'items',
 *    'saved',
 *    'cart'
 *  ];
 *
 * @ignore
 */
export declare function topologicalSort(graph: StateKeyGraph): string[];
/**
 * Returns if the parameter is a object or not.
 *
 * @ignore
 */
export declare function isObject(obj: any): boolean;
