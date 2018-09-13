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
    var type1 = getActionTypeFromInstance(action1);
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
export var setValue = function (obj, prop, val) {
    obj = Object.assign({}, obj);
    var split = prop.split('.');
    var lastIndex = split.length - 1;
    split.reduce(function (acc, part, index) {
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
export var getValue = function (obj, prop) { return prop.split('.').reduce(function (acc, part) { return acc && acc[part]; }, obj); };
//# sourceMappingURL=utils.js.map
