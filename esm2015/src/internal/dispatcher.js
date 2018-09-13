import { Injectable, ErrorHandler, NgZone } from '@angular/core';
import { of, forkJoin, empty, Subject, throwError } from 'rxjs';
import { shareReplay, filter, exhaustMap, take } from 'rxjs/operators';
import { compose } from '../utils/compose';
import { InternalActions } from '../actions-stream';
import { StateStream } from './state-stream';
import { PluginManager } from '../plugin-manager';
import { enterZone } from '../operators/zone';
/**
 * Internal Action result stream that is emitted when an action is completed.
 * This is used as a method of returning the action result to the dispatcher
 * for the observable returned by the dispatch(...) call.
 * The dispatcher then asynchronously pushes the result from this stream onto the main action stream as a result.
 */
export class InternalDispatchedActionResults extends Subject {
}
InternalDispatchedActionResults.decorators = [
    { type: Injectable },
];
export class InternalDispatcher {
    constructor(_errorHandler, _actions, _actionResults, _pluginManager, _stateStream, _ngZone) {
        this._errorHandler = _errorHandler;
        this._actions = _actions;
        this._actionResults = _actionResults;
        this._pluginManager = _pluginManager;
        this._stateStream = _stateStream;
        this._ngZone = _ngZone;
    }
    /**
       * Dispatches event(s).
       */
    dispatch(event) {
        const result = this._ngZone.runOutsideAngular(() => {
            if (Array.isArray(event)) {
                return forkJoin(event.map(a => this.dispatchSingle(a)));
            }
            else {
                return this.dispatchSingle(event);
            }
        });
        result.subscribe({
            error: error => this._ngZone.run(() => this._errorHandler.handleError(error))
        });
        return result.pipe(enterZone(this._ngZone));
    }
    dispatchSingle(action) {
        const prevState = this._stateStream.getValue();
        const plugins = this._pluginManager.plugins;
        return compose([
            ...plugins,
            (nextState, nextAction) => {
                if (nextState !== prevState) {
                    this._stateStream.next(nextState);
                }
                const actionResult$ = this.getActionResultStream(nextAction);
                actionResult$.subscribe(ctx => this._actions.next(ctx));
                this._actions.next({ action: nextAction, status: "DISPATCHED" /* Dispatched */ });
                return this.createDispatchObservable(actionResult$);
            }
        ])(prevState, action).pipe(shareReplay());
    }
    getActionResultStream(action) {
        return this._actionResults.pipe(filter((ctx) => ctx.action === action && ctx.status !== "DISPATCHED" /* Dispatched */), take(1), shareReplay());
    }
    createDispatchObservable(actionResult$) {
        return actionResult$
            .pipe(exhaustMap((ctx) => {
            switch (ctx.status) {
                case "SUCCESSFUL" /* Successful */:
                    return of(this._stateStream.getValue());
                case "ERRORED" /* Errored */:
                    return throwError(ctx.error);
                default:
                    return empty();
            }
        }))
            .pipe(shareReplay());
    }
}
InternalDispatcher.decorators = [
    { type: Injectable },
];
/** @nocollapse */
InternalDispatcher.ctorParameters = () => [
    { type: ErrorHandler, },
    { type: InternalActions, },
    { type: InternalDispatchedActionResults, },
    { type: PluginManager, },
    { type: StateStream, },
    { type: NgZone, },
];
//# sourceMappingURL=dispatcher.js.map
