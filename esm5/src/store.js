import { Injectable, NgZone } from '@angular/core';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map, take } from 'rxjs/operators';
import { getSelectorFn } from './utils/selector-utils';
import { InternalStateOperations } from './internal/state-operations';
import { StateStream } from './internal/state-stream';
import { enterZone } from './operators/zone';
var Store = /** @class */ (function () {
    function Store(_ngZone, _stateStream, _internalStateOperations) {
        this._ngZone = _ngZone;
        this._stateStream = _stateStream;
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Dispatches event(s).
       */
    Store.prototype.dispatch = function (event) {
        return this._internalStateOperations.getRootStateOperations().dispatch(event);
    };
    Store.prototype.select = function (selector) {
        var selectorFn = getSelectorFn(selector);
        return this._stateStream.pipe(map(selectorFn), catchError(function (err) {
            // if error is TypeError we swallow it to prevent usual errors with property access
            if (err instanceof TypeError) {
                return of(undefined);
            }
            // rethrow other errors
            throw err;
        }), distinctUntilChanged(), enterZone(this._ngZone));
    };
    Store.prototype.selectOnce = function (selector) {
        return this.select(selector).pipe(take(1));
    };
    Store.prototype.selectSnapshot = function (selector) {
        var selectorFn = getSelectorFn(selector);
        return selectorFn(this._stateStream.getValue());
    };
    /**
       * Allow the user to subscribe to the root of the state
       */
    Store.prototype.subscribe = function (fn) {
        return this._stateStream.pipe(enterZone(this._ngZone)).subscribe(fn);
    };
    /**
       * Return the raw value of the state.
       */
    Store.prototype.snapshot = function () {
        return this._internalStateOperations.getRootStateOperations().getState();
    };
    /**
       * Reset the state to a specific point in time. This method is useful
       * for plugin's who need to modify the state directly or unit testing.
       */
    Store.prototype.reset = function (state) {
        return this._internalStateOperations.getRootStateOperations().setState(state);
    };
    return Store;
}());
export { Store };
Store.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Store.ctorParameters = function () { return [
    { type: NgZone, },
    { type: StateStream, },
    { type: InternalStateOperations, },
]; };
//# sourceMappingURL=store.js.map
