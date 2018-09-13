import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { StateClass, MappedStore } from './internals';
import { InternalActions } from '../actions-stream';
import { InternalDispatchedActionResults } from '../internal/dispatcher';
import { StateContextFactory } from '../internal/state-context-factory';
/**
 * State factory class
 * @ignore
 */
export declare class StateFactory {
    private _injector;
    private _parentFactory;
    private _actions;
    private _actionResults;
    private _stateContextFactory;
    readonly states: MappedStore[];
    private _states;
    private _connected;
    constructor(_injector: Injector, _parentFactory: StateFactory, _actions: InternalActions, _actionResults: InternalDispatchedActionResults, _stateContextFactory: StateContextFactory);
    /**
     * Add a new state to the global defs.
     */
    add(oneOrManyStateClasses: StateClass | StateClass[]): MappedStore[];
    /**
     * Add a set of states to the store and return the defaulsts
     */
    addAndReturnDefaults(stateClasses: any[]): {
        defaults: any;
        states: MappedStore[];
    };
    /**
     * Bind the actions to the handlers
     */
    connectActionHandlers(): void;
    /**
     * Invoke the init function on the states.
     */
    invokeInit(stateMetadatas: MappedStore[]): void;
    /**
     * Invoke actions on the states.
     */
    invokeActions(actions$: InternalActions, action: any): Observable<any[]>;
    /**
     * Create the state context
     */
    private createStateContext(metadata);
}
