import { Injectable } from '@angular/core';
import { InternalDispatcher } from '../internal/dispatcher';
import { StateStream } from './state-stream';
import { NgxsConfig } from '../symbols';
import { deepFreeze } from '../utils/freeze';
/**
 * State Context factory class
 * @ignore
 */
var InternalStateOperations = /** @class */ (function () {
    function InternalStateOperations(_stateStream, _dispatcher, _config) {
        this._stateStream = _stateStream;
        this._dispatcher = _dispatcher;
        this._config = _config;
    }
    /**
       * Returns the root state operators.
       */
    InternalStateOperations.prototype.getRootStateOperations = function () {
        var _this = this;
        var rootStateOperations = {
            getState: function () { return _this._stateStream.getValue(); },
            setState: function (newState) { return _this._stateStream.next(newState); },
            dispatch: function (actions) { return _this._dispatcher.dispatch(actions); }
        };
        if (this._config.developmentMode) {
            return this.ensureStateAndActionsAreImmutable(rootStateOperations);
        }
        return rootStateOperations;
    };
    InternalStateOperations.prototype.ensureStateAndActionsAreImmutable = function (root) {
        return {
            getState: function () { return root.getState(); },
            setState: function (value) {
                var frozenValue = deepFreeze(value);
                return root.setState(frozenValue);
            },
            dispatch: function (actions) {
                return root.dispatch(actions);
            }
        };
    };
    return InternalStateOperations;
}());
export { InternalStateOperations };
InternalStateOperations.decorators = [
    { type: Injectable },
];
/** @nocollapse */
InternalStateOperations.ctorParameters = function () { return [
    { type: StateStream, },
    { type: InternalDispatcher, },
    { type: NgxsConfig, },
]; };
//# sourceMappingURL=state-operations.js.map
