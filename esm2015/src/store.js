import { Injectable, NgZone } from '@angular/core';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, map, take } from 'rxjs/operators';
import { getSelectorFn } from './utils/selector-utils';
import { InternalStateOperations } from './internal/state-operations';
import { StateStream } from './internal/state-stream';
import { enterZone } from './operators/zone';
export class Store {
    constructor(_ngZone, _stateStream, _internalStateOperations) {
        this._ngZone = _ngZone;
        this._stateStream = _stateStream;
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Dispatches event(s).
       */
    dispatch(event) {
        return this._internalStateOperations.getRootStateOperations().dispatch(event);
    }
    select(selector) {
        const selectorFn = getSelectorFn(selector);
        return this._stateStream.pipe(map(selectorFn), catchError(err => {
            // if error is TypeError we swallow it to prevent usual errors with property access
            if (err instanceof TypeError) {
                return of(undefined);
            }
            // rethrow other errors
            throw err;
        }), distinctUntilChanged(), enterZone(this._ngZone));
    }
    selectOnce(selector) {
        return this.select(selector).pipe(take(1));
    }
    selectSnapshot(selector) {
        const selectorFn = getSelectorFn(selector);
        return selectorFn(this._stateStream.getValue());
    }
    /**
       * Allow the user to subscribe to the root of the state
       */
    subscribe(fn) {
        return this._stateStream.pipe(enterZone(this._ngZone)).subscribe(fn);
    }
    /**
       * Return the raw value of the state.
       */
    snapshot() {
        return this._internalStateOperations.getRootStateOperations().getState();
    }
    /**
       * Reset the state to a specific point in time. This method is useful
       * for plugin's who need to modify the state directly or unit testing.
       */
    reset(state) {
        return this._internalStateOperations.getRootStateOperations().setState(state);
    }
}
Store.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Store.ctorParameters = () => [
    { type: NgZone, },
    { type: StateStream, },
    { type: InternalStateOperations, },
];
//# sourceMappingURL=store.js.map
