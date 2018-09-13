import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
import { Store } from '../store';
import { fastPropGetter } from '../internal/internals';
import { META_KEY } from '../symbols';
/**
 * Allows the select decorator to get access to the DI store.
 * @ignore
 */
var SelectFactory = /** @class */ (function () {
    function SelectFactory(store) {
        SelectFactory.store = store;
    }
    return SelectFactory;
}());
export { SelectFactory };
SelectFactory.store = undefined;
SelectFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SelectFactory.ctorParameters = function () { return [
    { type: Store, },
]; };
/**
 * Decorator for selecting a slice of state from the store.
 */
export function Select(selectorOrFeature) {
    var paths = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        paths[_i - 1] = arguments[_i];
    }
    return function (target, name) {
        var selectorFnName = '__' + name + '__selector';
        if (!selectorOrFeature) {
            // if foo$ => make it just foo
            selectorOrFeature = name.lastIndexOf('$') === name.length - 1 ? name.substring(0, name.length - 1) : name;
        }
        var createSelect = function (fn) {
            var store = SelectFactory.store;
            if (!store) {
                throw new Error('SelectFactory not connected to store!');
            }
            return store.select(fn);
        };
        var createSelector = function () {
            if (typeof selectorOrFeature === 'string') {
                var propsArray = paths.length ? tslib_1.__spread([selectorOrFeature], paths) : selectorOrFeature.split('.');
                return fastPropGetter(propsArray);
            }
            else if (selectorOrFeature[META_KEY] && selectorOrFeature[META_KEY].path) {
                return fastPropGetter(selectorOrFeature[META_KEY].path.split('.'));
            }
            else {
                return selectorOrFeature;
            }
        };
        if (target[selectorFnName]) {
            throw new Error('You cannot use @Select decorator and a ' + selectorFnName + ' property.');
        }
        if (delete target[name]) {
            Object.defineProperty(target, selectorFnName, {
                writable: true,
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(target, name, {
                get: function () {
                    return this[selectorFnName] || (this[selectorFnName] = createSelect.apply(this, [createSelector()]));
                },
                enumerable: true,
                configurable: true
            });
        }
    };
}
//# sourceMappingURL=select.js.map
