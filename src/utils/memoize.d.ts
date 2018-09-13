/**
 * Memoize a function on its last inputs only.
 * Oringinally from: https://github.com/reduxjs/reselect/blob/master/src/index.js
 *
 * @ignore
 */
export declare function memoize(func: any, equalityCheck?: (a: any, b: any) => boolean): (...args: any[]) => any;
