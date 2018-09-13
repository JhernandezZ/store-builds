import * as tslib_1 from "tslib";
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
var InternalDispatchedActionResults = /** @class */ (function (_super) {
    tslib_1.__extends(InternalDispatchedActionResults, _super);
    function InternalDispatchedActionResults() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InternalDispatchedActionResults;
}(Subject));
export { InternalDispatchedActionResults };
InternalDispatchedActionResults.decorators = [
    { type: Injectable },
];
var InternalDispatcher = /** @class */ (function () {
    function InternalDispatcher(_errorHandler, _actions, _actionResults, _pluginManager, _stateStream, _ngZone) {
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
    InternalDispatcher.prototype.dispatch = function (event) {
        var _this = this;
        var result = this._ngZone.runOutsideAngular(function () {
            if (Array.isArray(event)) {
                return forkJoin(event.map(function (a) { return _this.dispatchSingle(a); }));
            }
            else {
                return _this.dispatchSingle(event);
            }
        });
        result.subscribe({
            error: function (error) { return _this._ngZone.run(function () { return _this._errorHandler.handleError(error); }); }
        });
        return result.pipe(enterZone(this._ngZone));
    };
    InternalDispatcher.prototype.dispatchSingle = function (action) {
        var _this = this;
        var prevState = this._stateStream.getValue();
        var plugins = this._pluginManager.plugins;
        return compose(tslib_1.__spread(plugins, [
            function (nextState, nextAction) {
                if (nextState !== prevState) {
                    _this._stateStream.next(nextState);
                }
                var actionResult$ = _this.getActionResultStream(nextAction);
                actionResult$.subscribe(function (ctx) { return _this._actions.next(ctx); });
                _this._actions.next({ action: nextAction, status: "DISPATCHED" /* Dispatched */ });
                return _this.createDispatchObservable(actionResult$);
            }
        ]))(prevState, action).pipe(shareReplay());
    };
    InternalDispatcher.prototype.getActionResultStream = function (action) {
        return this._actionResults.pipe(filter(function (ctx) { return ctx.action === action && ctx.status !== "DISPATCHED"; } /* Dispatched */), take(1), shareReplay());
    };
    InternalDispatcher.prototype.createDispatchObservable = function (actionResult$) {
        var _this = this;
        return actionResult$
            .pipe(exhaustMap(function (ctx) {
            switch (ctx.status) {
                case "SUCCESSFUL" /* Successful */:
                    return of(_this._stateStream.getValue());
                case "ERRORED" /* Errored */:
                    return throwError(ctx.error);
                default:
                    return empty();
            }
        }))
            .pipe(shareReplay());
    };
    return InternalDispatcher;
}());
export { InternalDispatcher };
InternalDispatcher.decorators = [
    { type: Injectable },
];
/** @nocollapse */
InternalDispatcher.ctorParameters = function () { return [
    { type: ErrorHandler, },
    { type: InternalActions, },
    { type: InternalDispatchedActionResults, },
    { type: PluginManager, },
    { type: StateStream, },
    { type: NgZone, },
]; };
//# sourceMappingURL=dispatcher.js.map
