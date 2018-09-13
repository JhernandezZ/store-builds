import { createSelector } from '../utils/selector-utils';
/**
 * Decorator for memoizing a state selector.
 */
export function Selector(selectors) {
    return (target, key, descriptor) => {
        if (descriptor.value !== null) {
            const originalFn = descriptor.value;
            const memoizedFn = createSelector(selectors, originalFn, { containerClass: target, selectorName: key });
            return {
                configurable: true,
                get() {
                    return memoizedFn;
                }
            };
        }
        else {
            throw new Error('Selectors only work on methods');
        }
    };
}
//# sourceMappingURL=selector.js.map
