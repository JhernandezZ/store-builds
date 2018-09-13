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
export class StateFactory {
    constructor(_injector, _parentFactory, _actions, _actionResults, _stateContextFactory) {
        this._injector = _injector;
        this._parentFactory = _parentFactory;
        this._actions = _actions;
        this._actionResults = _actionResults;
        this._stateContextFactory = _stateContextFactory;
        this._states = [];
        this._connected = false;
    }
    get states() {
        return this._parentFactory ? this._parentFactory.states : this._states;
    }
    /**
       * Add a new state to the global defs.
       */
    add(oneOrManyStateClasses) {
        let stateClasses;
        if (!Array.isArray(oneOrManyStateClasses)) {
            stateClasses = [oneOrManyStateClasses];
        }
        else {
            stateClasses = oneOrManyStateClasses;
        }
        const stateGraph = buildGraph(stateClasses);
        const sortedStates = topologicalSort(stateGraph);
        const depths = findFullParentPath(stateGraph);
        const nameGraph = nameToState(stateClasses);
        const mappedStores = [];
        for (const name of sortedStates) {
            const stateClass = nameGraph[name];
            if (!stateClass[META_KEY]) {
                throw new Error('States must be decorated with @State() decorator');
            }
            const depth = depths[name];
            const { actions } = stateClass[META_KEY];
            let { defaults } = stateClass[META_KEY];
            stateClass[META_KEY].path = depth;
            // ensure our store hasn't already been added
            // but dont throw since it could be lazy
            // loaded from different paths
            const has = this.states.find(s => s.name === name);
            if (!has) {
                // create new instance of defaults
                if (Array.isArray(defaults)) {
                    defaults = [...defaults];
                }
                else if (isObject(defaults)) {
                    defaults = Object.assign({}, defaults);
                }
                else if (defaults === undefined) {
                    defaults = {};
                }
                const instance = this._injector.get(stateClass);
                mappedStores.push({
                    actions,
                    instance,
                    defaults,
                    name,
                    depth
                });
            }
        }
        this.states.push(...mappedStores);
        return mappedStores;
    }
    /**
       * Add a set of states to the store and return the defaulsts
       */
    addAndReturnDefaults(stateClasses) {
        if (stateClasses) {
            const states = this.add(stateClasses);
            const defaults = states.reduce((result, meta) => setValue(result, meta.depth, meta.defaults), {});
            return { defaults, states };
        }
    }
    /**
       * Bind the actions to the handlers
       */
    connectActionHandlers() {
        if (this._connected)
            return;
        this._actions
            .pipe(filter((ctx) => ctx.status === "DISPATCHED" /* Dispatched */), mergeMap(({ action }) => this.invokeActions(this._actions, action).pipe(map(() => ({ action, status: "SUCCESSFUL" /* Successful */ })), defaultIfEmpty({ action, status: "CANCELED" /* Canceled */ }), catchError(error => of({ action, status: "ERRORED" /* Errored */, error })))))
            .subscribe(ctx => this._actionResults.next(ctx));
        this._connected = true;
    }
    /**
       * Invoke the init function on the states.
       */
    invokeInit(stateMetadatas) {
        for (const metadata of stateMetadatas) {
            const instance = metadata.instance;
            if (instance.ngxsOnInit) {
                const stateContext = this.createStateContext(metadata);
                instance.ngxsOnInit(stateContext);
            }
        }
    }
    /**
       * Invoke actions on the states.
       */
    invokeActions(actions$, action) {
        const results = [];
        for (const metadata of this.states) {
            const type = getActionTypeFromInstance(action);
            const actionMetas = metadata.actions[type];
            if (actionMetas) {
                for (const actionMeta of actionMetas) {
                    const stateContext = this.createStateContext(metadata);
                    try {
                        let result = metadata.instance[actionMeta.fn](stateContext, action);
                        if (result instanceof Promise) {
                            result = from(result);
                        }
                        if (result instanceof Observable) {
                            result = result.pipe(actionMeta.options.cancelUncompleted
                                ? takeUntil(actions$.pipe(ofActionDispatched(action)))
                                : map(r => r)); // map acts like a noop
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
        }
        if (!results.length) {
            results.push(of({}));
        }
        return forkJoin(results);
    }
    /**
       * Create the state context
       */
    createStateContext(metadata) {
        return this._stateContextFactory.createStateContext(metadata);
    }
}
StateFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateFactory.ctorParameters = () => [
    { type: Injector, },
    { type: StateFactory, decorators: [{ type: Optional }, { type: SkipSelf },] },
    { type: InternalActions, },
    { type: InternalDispatchedActionResults, },
    { type: StateContextFactory, },
];
//# sourceMappingURL=state-factory.js.map
