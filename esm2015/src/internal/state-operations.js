import { Injectable } from '@angular/core';
import { InternalDispatcher } from '../internal/dispatcher';
import { StateStream } from './state-stream';
import { NgxsConfig } from '../symbols';
import { deepFreeze } from '../utils/freeze';
/**
 * State Context factory class
 * @ignore
 */
export class InternalStateOperations {
    constructor(_stateStream, _dispatcher, _config) {
        this._stateStream = _stateStream;
        this._dispatcher = _dispatcher;
        this._config = _config;
    }
    /**
       * Returns the root state operators.
       */
    getRootStateOperations() {
        const rootStateOperations = {
            getState: () => this._stateStream.getValue(),
            setState: newState => this._stateStream.next(newState),
            dispatch: actions => this._dispatcher.dispatch(actions)
        };
        if (this._config.developmentMode) {
            return this.ensureStateAndActionsAreImmutable(rootStateOperations);
        }
        return rootStateOperations;
    }
    ensureStateAndActionsAreImmutable(root) {
        return {
            getState: () => root.getState(),
            setState: value => {
                const frozenValue = deepFreeze(value);
                return root.setState(frozenValue);
            },
            dispatch: actions => {
                return root.dispatch(actions);
            }
        };
    }
}
InternalStateOperations.decorators = [
    { type: Injectable },
];
/** @nocollapse */
InternalStateOperations.ctorParameters = () => [
    { type: StateStream, },
    { type: InternalDispatcher, },
    { type: NgxsConfig, },
];
//# sourceMappingURL=state-operations.js.map
