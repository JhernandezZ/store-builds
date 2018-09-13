import * as tslib_1 from "tslib";
/**
 * Composes a array of functions from left to right. Example:
 *
 *      compose([fn, final])(state, action);
 *
 * then the funcs have a signature like:
 *
 *      function fn (state, action, next) {
 *          console.log('here', state, action, next);
 *          return next(state, action);
 *      }
 *
 *      function final (state, action) {
 *          console.log('here', state, action);
 *          return state;
 *      }
 *
 * the last function should not call `next`.
 *
 * @ignore
 */
export var compose = function (funcs) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var curr = funcs.shift();
    return curr.apply(void 0, tslib_1.__spread(args, [function () {
            var nextArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nextArgs[_i] = arguments[_i];
            }
            return compose(funcs).apply(void 0, tslib_1.__spread(nextArgs));
        }]));
}; };
//# sourceMappingURL=compose.js.map
