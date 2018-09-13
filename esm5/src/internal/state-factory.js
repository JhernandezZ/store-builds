import * as tslib_1 from "tslib";
import { Injector, Injectable, SkipSelf, Optional } from '@angular/core';
import { Observable, of, forkJoin, from, throwError } from 'rxjs';
import { shareReplay, takeUntil, map, catchError, filter, mergeMap, defaultIfEmpty } from 'rxjs/operators';
import { META_KEY } from '../symbols';
import { topologicalSort, buildGraph, findFullParentPath, nameToState, isObject } from './internals';
import { getActionTypeFromInstance, setValue } from '../utils/utils';
import { ofActionDispatched } from '../operators/of-action';
import { InternalActions } from '../actions-stream';
import { InternalDispatchedActionResults } from '../internal/dispatcher';
import { StateContextFactory } from '../internal/state-context-factory';
/**
 * State factory class
 * @ignore
 */
var StateFactory = /** @class */ (function () {
    function StateFactory(_injector, _parentFactory, _actions, _actionResults, _stateContextFactory) {
        this._injector = _injector;
        this._parentFactory = _parentFactory;
        this._actions = _actions;
        this._actionResults = _actionResults;
        this._stateContextFactory = _stateContextFactory;
        this._states = [];
        this._connected = false;
    }
    Object.defineProperty(StateFactory.prototype, "states", {
        get: function () {
            return this._parentFactory ? this._parentFactory.states : this._states;
        },
        enumerable: true,
        configurable: true
    });
    /**
       * Add a new state to the global defs.
       */
    StateFactory.prototype.add = function (oneOrManyStateClasses) {
        var stateClasses;
        if (!Array.isArray(oneOrManyStateClasses)) {
            stateClasses = [oneOrManyStateClasses];
        }
        else {
            stateClasses = oneOrManyStateClasses;
        }
        var stateGraph = buildGraph(stateClasses);
        var sortedStates = topologicalSort(stateGraph);
        var depths = findFullParentPath(stateGraph);
        var nameGraph = nameToState(stateClasses);
        var mappedStores = [];
        var _loop_1 = function (name_1) {
            var stateClass = nameGraph[name_1];
            if (!stateClass[META_KEY]) {
                throw new Error('States must be decorated with @State() decorator');
            }
            var depth = depths[name_1];
            var actions = stateClass[META_KEY].actions;
            var defaults = stateClass[META_KEY].defaults;
            stateClass[META_KEY].path = depth;
            // ensure our store hasn't already been added
            // but dont throw since it could be lazy
            // loaded from different paths
            var has = this_1.states.find(function (s) { return s.name === name_1; });
            if (!has) {
                // create new instance of defaults
                if (Array.isArray(defaults)) {
                    defaults = tslib_1.__spread(defaults);
                }
                else if (isObject(defaults)) {
                    defaults = Object.assign({}, defaults);
                }
                else if (defaults === undefined) {
                    defaults = {};
                }
                var instance = this_1._injector.get(stateClass);
                mappedStores.push({
                    actions: actions,
                    instance: instance,
                    defaults: defaults,
                    name: name_1,
                    depth: depth
                });
            }
        };
        var this_1 = this;
        try {
            for (var sortedStates_1 = tslib_1.__values(sortedStates), sortedStates_1_1 = sortedStates_1.next(); !sortedStates_1_1.done; sortedStates_1_1 = sortedStates_1.next()) {
                var name_1 = sortedStates_1_1.value;
                _loop_1(name_1);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (sortedStates_1_1 && !sortedStates_1_1.done && (_a = sortedStates_1.return)) _a.call(sortedStates_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        (_b = this.states).push.apply(_b, tslib_1.__spread(mappedStores));
        return mappedStores;
        var e_1, _a, _b;
    };
    /**
       * Add a set of states to the store and return the defaulsts
       */
    StateFactory.prototype.addAndReturnDefaults = function (stateClasses) {
        if (stateClasses) {
            var states = this.add(stateClasses);
            var defaults = states.reduce(function (result, meta) { return setValue(result, meta.depth, meta.defaults); }, {});
            return { defaults: defaults, states: states };
        }
    };
    /**
       * Bind the actions to the handlers
       */
    StateFactory.prototype.connectActionHandlers = function () {
        var _this = this;
        if (this._connected)
            return;
        this._actions
            .pipe(filter(function (ctx) { return ctx.status === "DISPATCHED"; } /* Dispatched */), mergeMap(function (_a) {
            var action = _a.action;
            return _this.invokeActions(_this._actions, action).pipe(map(function () { return ({ action: action, status: "SUCCESSFUL" /* Successful */ }); }), defaultIfEmpty({ action: action, status: "CANCELED" /* Canceled */ }), catchError(function (error) { return of({ action: action, status: "ERRORED" /* Errored */, error: error }); }));
        }))
            .subscribe(function (ctx) { return _this._actionResults.next(ctx); });
        this._connected = true;
    };
    /**
       * Invoke the init function on the states.
       */
    StateFactory.prototype.invokeInit = function (stateMetadatas) {
        try {
            for (var stateMetadatas_1 = tslib_1.__values(stateMetadatas), stateMetadatas_1_1 = stateMetadatas_1.next(); !stateMetadatas_1_1.done; stateMetadatas_1_1 = stateMetadatas_1.next()) {
                var metadata = stateMetadatas_1_1.value;
                var instance = metadata.instance;
                if (instance.ngxsOnInit) {
                    var stateContext = this.createStateContext(metadata);
                    instance.ngxsOnInit(stateContext);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (stateMetadatas_1_1 && !stateMetadatas_1_1.done && (_a = stateMetadatas_1.return)) _a.call(stateMetadatas_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _a;
    };
    /**
       * Invoke actions on the states.
       */
    StateFactory.prototype.invokeActions = function (actions$, action) {
        var results = [];
        try {
            for (var _a = tslib_1.__values(this.states), _b = _a.next(); !_b.done; _b = _a.next()) {
                var metadata = _b.value;
                var type = getActionTypeFromInstance(action);
                var actionMetas = metadata.actions[type];
                if (actionMetas) {
                    try {
                        for (var actionMetas_1 = tslib_1.__values(actionMetas), actionMetas_1_1 = actionMetas_1.next(); !actionMetas_1_1.done; actionMetas_1_1 = actionMetas_1.next()) {
                            var actionMeta = actionMetas_1_1.value;
                            var stateContext = this.createStateContext(metadata);
                            try {
                                var result = metadata.instance[actionMeta.fn](stateContext, action);
                                if (result instanceof Promise) {
                                    result = from(result);
                                }
                                if (result instanceof Observable) {
                                    result = result.pipe(actionMeta.options.cancelUncompleted
                                        ? takeUntil(actions$.pipe(ofActionDispatched(action)))
                                        : map(function (r) { return r; })); // map acts like a noop
                                }
                                else {
                                    result = of({}).pipe(shareReplay());
                                }
                                results.push(result);
                            }
                            catch (e) {
                                results.push(throwError(e));
                            }
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (actionMetas_1_1 && !actionMetas_1_1.done && (_c = actionMetas_1.return)) _c.call(actionMetas_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (!results.length) {
            results.push(of({}));
        }
        return forkJoin(results);
        var e_4, _d, e_3, _c;
    };
    /**
       * Create the state context
       */
    StateFactory.prototype.createStateContext = function (metadata) {
        return this._stateContextFactory.createStateContext(metadata);
    };
    return StateFactory;
}());
export { StateFactory };
StateFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateFactory.ctorParameters = function () { return [
    { type: Injector, },
    { type: StateFactory, decorators: [{ type: Optional }, { type: SkipSelf },] },
    { type: InternalActions, },
    { type: InternalDispatchedActionResults, },
    { type: StateContextFactory, },
]; };
//# sourceMappingURL=state-factory.js.map
