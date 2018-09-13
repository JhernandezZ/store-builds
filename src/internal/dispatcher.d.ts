import { ErrorHandler, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { InternalActions, ActionContext } from '../actions-stream';
import { StateStream } from './state-stream';
import { PluginManager } from '../plugin-manager';
/**
 * Internal Action result stream that is emitted when an action is completed.
 * This is used as a method of returning the action result to the dispatcher
 * for the observable returned by the dispatch(...) call.
 * The dispatcher then asynchronously pushes the result from this stream onto the main action stream as a result.
 */
export declare class InternalDispatchedActionResults extends Subject<ActionContext> {
}
export declare class InternalDispatcher {
    private _errorHandler;
    private _actions;
    private _actionResults;
    private _pluginManager;
    private _stateStream;
    private _ngZone;
    constructor(_errorHandler: ErrorHandler, _actions: InternalActions, _actionResults: InternalDispatchedActionResults, _pluginManager: PluginManager, _stateStream: StateStream, _ngZone: NgZone);
    /**
     * Dispatches event(s).
     */
    dispatch(event: any | any[]): Observable<any>;
    private dispatchSingle(action);
    private getActionResultStream(action);
    private createDispatchObservable(actionResult$);
}
