import { StateOperations } from '../internal/internals';
import { InternalDispatcher } from '../internal/dispatcher';
import { StateStream } from './state-stream';
import { NgxsConfig } from '../symbols';
/**
 * State Context factory class
 * @ignore
 */
export declare class InternalStateOperations {
    private _stateStream;
    private _dispatcher;
    private _config;
    constructor(_stateStream: StateStream, _dispatcher: InternalDispatcher, _config: NgxsConfig);
    /**
     * Returns the root state operators.
     */
    getRootStateOperations(): StateOperations<any>;
    private ensureStateAndActionsAreImmutable(root);
}
