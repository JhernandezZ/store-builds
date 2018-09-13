import * as tslib_1 from "tslib";
import { fastPropGetter, ensureSelectorMetadata, getSelectorMetadata, getStoreMetadata } from '../internal/internals';
import { memoize } from '../utils/memoize';
/**
 * Function for creating a selector
 * @param selectors The selectors to use to create the arguments of this function
 * @param originalFn The original function being made into a selector
 */
export function createSelector(selectors, originalFn, creationMetadata) {
    var wrappedFn = function wrappedSelectorFn() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var returnValue = originalFn.apply(void 0, tslib_1.__spread(args));
        if (returnValue instanceof Function) {
            var innerMemoizedFn = memoize.apply(null, [returnValue]);
            return innerMemoizedFn;
        }
        return returnValue;
    };
    var memoizedFn = memoize(wrappedFn);
    var containerClass = creationMetadata && creationMetadata.containerClass;
    var fn = function (state) {
        var results = [];
        var selectorsToApply = [];
        if (containerClass) {
            // If we are on a state class, add it as the first selector parameter
            var metadata = getStoreMetadata(containerClass);
            if (metadata) {
                selectorsToApply.push(containerClass);
            }
        }
        if (selectors) {
            selectorsToApply.push.apply(selectorsToApply, tslib_1.__spread(selectors));
        }
        // Determine arguments from the app state using the selectors
        if (selectorsToApply) {
            results.push.apply(results, tslib_1.__spread(selectorsToApply.map(function (a) { return getSelectorFn(a)(state); })));
        }
        // if the lambda tries to access a something on the
        // state that doesn't exist, it will throw a TypeError.
        // since this is quite usual behaviour, we simply return undefined if so.
        try {
            return memoizedFn.apply(void 0, tslib_1.__spread(results));
        }
        catch (ex) {
            if (ex instanceof TypeError) {
                return undefined;
            }
            throw ex;
        }
    };
    var selectorMetaData = ensureSelectorMetadata(memoizedFn);
    selectorMetaData.originalFn = originalFn;
    selectorMetaData.selectFromAppState = fn;
    if (creationMetadata) {
        selectorMetaData.containerClass = creationMetadata.containerClass;
        selectorMetaData.selectorName = creationMetadata.selectorName;
    }
    return memoizedFn;
}
/**
 * This function gets the selector function to be used to get the selected slice from the app state
 * @ignore
 */
export function getSelectorFn(selector) {
    var selectorMetadata = getSelectorMetadata(selector);
    if (selectorMetadata) {
        var selectFromAppState = selectorMetadata.selectFromAppState;
        if (selectFromAppState) {
            return selectFromAppState;
        }
    }
    var stateMetadata = getStoreMetadata(selector);
    if (stateMetadata && stateMetadata.path) {
        return fastPropGetter(stateMetadata.path.split('.'));
    }
    return selector;
}
//# sourceMappingURL=selector-utils.js.map
