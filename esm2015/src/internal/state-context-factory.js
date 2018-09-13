import { Injectable } from '@angular/core';
import { setValue, getValue } from '../utils/utils';
import { InternalStateOperations } from '../internal/state-operations';
/**
 * State Context factory class
 * @ignore
 */
export class StateContextFactory {
    constructor(_internalStateOperations) {
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Create the state context
       */
    createStateContext(metadata) {
        const root = this._internalStateOperations.getRootStateOperations();
        return {
            getState() {
                const state = root.getState();
                return getValue(state, metadata.depth);
            },
            patchState(val) {
                const isArray = Array.isArray(val);
                const isPrimitive = typeof val !== 'object';
                if (isArray) {
                    throw new Error('Patching arrays is not supported.');
                }
                else if (isPrimitive) {
                    throw new Error('Patching primitives is not supported.');
                }
                const state = root.getState();
                const local = getValue(state, metadata.depth);
                const clone = Object.assign({}, local);
                for (const k in val) {
                    clone[k] = val[k];
                }
                const newState = setValue(state, metadata.depth, clone);
                root.setState(newState);
                return newState;
            },
            setState(val) {
                let state = root.getState();
                state = setValue(state, metadata.depth, val);
                root.setState(state);
                return state;
            },
            dispatch(actions) {
                return root.dispatch(actions);
            }
        };
    }
}
StateContextFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateContextFactory.ctorParameters = () => [
    { type: InternalStateOperations, },
];
//# sourceMappingURL=state-context-factory.js.map
