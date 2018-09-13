import { Injectable } from '@angular/core';
import { setValue, getValue } from '../utils/utils';
import { InternalStateOperations } from '../internal/state-operations';
/**
 * State Context factory class
 * @ignore
 */
var StateContextFactory = /** @class */ (function () {
    function StateContextFactory(_internalStateOperations) {
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Create the state context
       */
    StateContextFactory.prototype.createStateContext = function (metadata) {
        var root = this._internalStateOperations.getRootStateOperations();
        return {
            getState: function () {
                var state = root.getState();
                return getValue(state, metadata.depth);
            },
            patchState: function (val) {
                var isArray = Array.isArray(val);
                var isPrimitive = typeof val !== 'object';
                if (isArray) {
                    throw new Error('Patching arrays is not supported.');
                }
                else if (isPrimitive) {
                    throw new Error('Patching primitives is not supported.');
                }
                var state = root.getState();
                var local = getValue(state, metadata.depth);
                var clone = Object.assign({}, local);
                for (var k in val) {
                    clone[k] = val[k];
                }
                var newState = setValue(state, metadata.depth, clone);
                root.setState(newState);
                return newState;
            },
            setState: function (val) {
                var state = root.getState();
                state = setValue(state, metadata.depth, val);
                root.setState(state);
                return state;
            },
            dispatch: function (actions) {
                return root.dispatch(actions);
            }
        };
    };
    return StateContextFactory;
}());
export { StateContextFactory };
StateContextFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateContextFactory.ctorParameters = function () { return [
    { type: InternalStateOperations, },
]; };
//# sourceMappingURL=state-context-factory.js.map
