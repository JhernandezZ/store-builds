/**
 * Returns the type from an action instance.
 * @ignore
 */
export function getActionTypeFromInstance(action) {
    if (action.constructor && action.constructor.type) {
        return action.constructor.type;
    }
    return action.type;
}
/**
 * Matches a action
 * @ignore
 */
export function actionMatcher(action1) {
    const type1 = getActionTypeFromInstance(action1);
    return function (action2) {
        return type1 === getActionTypeFromInstance(action2);
    };
}
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
export const setValue = (obj, prop, val) => {
    obj = Object.assign({}, obj);
    const split = prop.split('.');
    const lastIndex = split.length - 1;
    split.reduce((acc, part, index) => {
        if (index === lastIndex) {
            acc[part] = val;
        }
        else {
            acc[part] = Object.assign({}, acc[part]);
        }
        return acc && acc[part];
    }, obj);
    return obj;
};
/**
 * Get a deeply nested value. Example:
 *
 *    getValue({ foo: bar: [] }, 'foo.bar') //=> []
 *
 * @ignore
 */
export const getValue = (obj, prop) => prop.split('.').reduce((acc, part) => acc && acc[part], obj);
//# sourceMappingURL=utils.js.map
