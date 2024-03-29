/**
 * Returns the type from an action instance.
 * @ignore
 */
export declare function getActionTypeFromInstance(action: any): string;
/**
 * Matches a action
 * @ignore
 */
export declare function actionMatcher(action1: any): (action2: any) => boolean;
/**
 * Set a deeply nested value. Example:
 *
 *   setValue({ foo: { bar: { eat: false } } },
 *      'foo.bar.eat', true) //=> { foo: { bar: { eat: true } } }
 *
 * While it traverses it also creates new objects from top down.
 *
 * @ignore
 */
export declare const setValue: (obj: any, prop: string, val: any) => any;
/**
 * Get a deeply nested value. Example:
 *
 *    getValue({ foo: bar: [] }, 'foo.bar') //=> []
 *
 * @ignore
 */
export declare const getValue: (obj: any, prop: string) => any;
