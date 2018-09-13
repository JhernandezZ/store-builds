import { createSelector } from '../utils/selector-utils';
/**
 * Decorator for memoizing a state selector.
 */
export function Selector(selectors) {
    return function (target, key, descriptor) {
        if (descriptor.value !== null) {
            var originalFn = descriptor.value;
            var memoizedFn_1 = createSelector(selectors, originalFn, { containerClass: target, selectorName: key });
            return {
                configurable: true,
                get: function () {
                    return memoizedFn_1;
                }
            };
        }
        else {
            throw new Error('Selectors only work on methods');
        }
    };
}
//# sourceMappingURL=selector.js.map
