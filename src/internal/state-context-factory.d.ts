import { StateContext } from '../symbols';
import { MappedStore } from '../internal/internals';
import { InternalStateOperations } from '../internal/state-operations';
/**
 * State Context factory class
 * @ignore
 */
export declare class StateContextFactory {
    private _internalStateOperations;
    constructor(_internalStateOperations: InternalStateOperations);
    /**
     * Create the state context
     */
    createStateContext(metadata: MappedStore): StateContext<any>;
}
