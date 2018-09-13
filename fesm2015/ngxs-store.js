import { InjectionToken, Injectable, NgZone, Optional, SkipSelf, Inject, ErrorHandler, Injector, NgModule } from '@angular/core';
import { map, filter, shareReplay, exhaustMap, take, takeUntil, catchError, mergeMap, defaultIfEmpty, distinctUntilChanged } from 'rxjs/operators';
import { Observable, Subject, BehaviorSubject, of, forkJoin, empty, throwError, from } from 'rxjs';

const ROOT_STATE_TOKEN = new InjectionToken('ROOT_STATE_TOKEN');
const FEATURE_STATE_TOKEN = new InjectionToken('FEATURE_STATE_TOKEN');
const META_KEY = 'NGXS_META';
const SELECTOR_META_KEY = 'NGXS_SELECTOR_META';
const NGXS_PLUGINS = new InjectionToken('NGXS_PLUGINS');
/**
 * The NGXS config settings.
 */
class NgxsConfig {
}

/**
 * Ensures metadata is attached to the class and returns it.
 *
 * @ignore
 */
function ensureStoreMetadata(target) {
    if (!target.hasOwnProperty(META_KEY)) {
        const defaultMetadata = {
            name: null,
            actions: {},
            defaults: {},
            path: null,
            children: [],
            instance: null
        };
        Object.defineProperty(target, META_KEY, { value: defaultMetadata });
    }
    return getStoreMetadata(target);
}
/**
 * Get the metadata attached to the class if it exists.
 *
 * @ignore
 */
function getStoreMetadata(target) {
    return target[META_KEY];
}
/**
 * Ensures metadata is attached to the selector and returns it.
 *
 * @ignore
 */
function ensureSelectorMetadata(target) {
    if (!target.hasOwnProperty(SELECTOR_META_KEY)) {
        const defaultMetadata = {
            selectFromAppState: null,
            originalFn: null,
            containerClass: null,
            selectorName: null
        };
        Object.defineProperty(target, SELECTOR_META_KEY, { value: defaultMetadata });
    }
    return getSelectorMetadata(target);
}
/**
 * Get the metadata attached to the selector if it exists.
 *
 * @ignore
 */
function getSelectorMetadata(target) {
    return target[SELECTOR_META_KEY];
}
/**
 * The generated function is faster than:
 * - pluck (Observable operator)
 * - memoize
 *
 * @ignore
 */
function fastPropGetter(paths) {
    const segments = paths;
    let seg = 'store.' + segments[0];
    let i = 0;
    const l = segments.length;
    let expr = seg;
    while (++i < l) {
        expr = expr + ' && ' + (seg = seg + '.' + segments[i]);
    }
    const fn = new Function('store', 'return ' + expr + ';');
    return fn;
}
/**
 * Given an array of states, it will return a object graph. Example:
 *    const states = [
 *      Cart,
 *      CartSaved,
 *      CartSavedItems
 *    ]
 *
 * would return:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * @ignore
 */
function buildGraph(stateClasses) {
    const findName = (stateClass) => {
        const meta = stateClasses.find(g => g === stateClass);
        if (!meta) {
            throw new Error(`Child state not found: ${stateClass}`);
        }
        if (!meta[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        return meta[META_KEY].name;
    };
    return stateClasses.reduce((result, stateClass) => {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        const { name, children } = stateClass[META_KEY];
        result[name] = (children || []).map(findName);
        return result;
    }, {});
}
/**
 * Given a states array, returns object graph
 * returning the name and state metadata. Example:
 *
 *  const graph = {
 *    cart: { metadata }
 *  };
 *
 * @ignore
 */
function nameToState(states) {
    return states.reduce((result, stateClass) => {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        const meta = stateClass[META_KEY];
        result[meta.name] = stateClass;
        return result;
    }, {});
}
/**
 * Given a object relationship graph will return the full path
 * for the child items. Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const r = {
 *    cart: 'cart',
 *    saved: 'cart.saved',
 *    items: 'cart.saved.items'
 *  };
 *
 * @ignore
 */
function findFullParentPath(obj, newObj = {}) {
    const visit = (child, keyToFind) => {
        for (const key in child) {
            if (child.hasOwnProperty(key) && child[key].indexOf(keyToFind) >= 0) {
                const parent = visit(child, key);
                return parent !== null ? `${parent}.${key}` : key;
            }
        }
        return null;
    };
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const parent = visit(obj, key);
            newObj[key] = parent ? `${parent}.${key}` : key;
        }
    }
    return newObj;
}
/**
 * Given a object graph, it will return the items topologically sorted Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const results = [
 *    'items',
 *    'saved',
 *    'cart'
 *  ];
 *
 * @ignore
 */
function topologicalSort(graph) {
    const sorted = [];
    const visited = {};
    const visit = (name, ancestors = []) => {
        if (!Array.isArray(ancestors)) {
            ancestors = [];
        }
        ancestors.push(name);
        visited[name] = true;
        graph[name].forEach((dep) => {
            if (ancestors.indexOf(dep) >= 0) {
                throw new Error(`Circular dependency '${dep}' is required by '${name}': ${ancestors.join(' -> ')}`);
            }
            if (visited[dep]) {
                return;
            }
            visit(dep, ancestors.slice(0));
        });
        if (sorted.indexOf(name) < 0) {
            sorted.push(name);
        }
    };
    Object.keys(graph).forEach(k => visit(k));
    return sorted.reverse();
}
/**
 * Returns if the parameter is a object or not.
 *
 * @ignore
 */
function isObject(obj) {
    return (typeof obj === 'object' && obj !== null) || typeof obj === 'function';
}

/**
 * Returns the type from an action instance.
 * @ignore
 */
function getActionTypeFromInstance(action) {
    if (action.constructor && action.constructor.type) {
        return action.constructor.type;
    }
    return action.type;
}
/**
 * Matches a action
 * @ignore
 */
function actionMatcher(action1) {
    const type1 = getActionTypeFromInstance(action1);
    return function (action2) {
        return type1 === getActionTypeFromInstance(action2);
    };
}
/**
 * Set a deeply nested value. Example:
 *
 *   setValue({ foo: { bar: { eat: false } } },
 *      'foo.bar.eat', true) //=> { foo: { bar: { eat: true } } }
 *
 * While it traverses it also creates new objects from top down.
 *
 * @ignore
 */
const setValue = (obj, prop, val) => {
    obj = Object.assign({}, obj);
    const split = prop.split('.');
    const lastIndex = split.length - 1;
    split.reduce((acc, part, index) => {
        if (index === lastIndex) {
            acc[part] = val;
        }
        else {
            acc[part] = Object.assign({}, acc[part]);
        }
        return acc && acc[part];
    }, obj);
    return obj;
};
/**
 * Get a deeply nested value. Example:
 *
 *    getValue({ foo: bar: [] }, 'foo.bar') //=> []
 *
 * @ignore
 */
const getValue = (obj, prop) => prop.split('.').reduce((acc, part) => acc && acc[part], obj);

/**
 * RxJS operator for selecting out specific actions.
 *
 * This will grab actions that have just been dispatched as well as actions that have completed
 */
function ofAction(...allowedTypes) {
    return ofActionOperator(allowedTypes);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been dispatched
 */
function ofActionDispatched(...allowedTypes) {
    return ofActionOperator(allowedTypes, "DISPATCHED" /* Dispatched */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been successfully completed
 */
function ofActionSuccessful(...allowedTypes) {
    return ofActionOperator(allowedTypes, "SUCCESSFUL" /* Successful */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been canceled
 */
function ofActionCanceled(...allowedTypes) {
    return ofActionOperator(allowedTypes, "CANCELED" /* Canceled */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just thrown an error
 */
function ofActionErrored(...allowedTypes) {
    return ofActionOperator(allowedTypes, "ERRORED" /* Errored */);
}
function ofActionOperator(allowedTypes, status) {
    const allowedMap = createAllowedMap(allowedTypes);
    return function (o) {
        return o.pipe(filterStatus(allowedMap, status), mapAction());
    };
}
function filterStatus(allowedTypes, status) {
    return filter((ctx) => {
        const actionType = getActionTypeFromInstance(ctx.action);
        const type = allowedTypes[actionType];
        return status ? type && ctx.status === status : type;
    });
}
function mapAction() {
    return map((ctx) => ctx.action);
}
function createAllowedMap(types) {
    return types.reduce((acc, klass) => {
        acc[getActionTypeFromInstance(klass)] = true;
        return acc;
    }, {});
}

/**
 * Operator to run the `subscribe` in a Angular zone.
 */
function enterZone(zone) {
    return (source) => {
        return new Observable((sink) => {
            return source.subscribe({
                next(x) {
                    zone.run(() => sink.next(x));
                },
                error(e) {
                    zone.run(() => sink.error(e));
                },
                complete() {
                    zone.run(() => sink.complete());
                }
            });
        });
    };
}

/**
 * Custom Subject that ensures that subscribers are notified of values in the order that they arrived.
 * A standard Subject does not have this guarantee.
 * For example, given the following code:
 * ```typescript
 *   const subject = new Subject<string>();
     subject.subscribe(value => {
       if (value === 'start') subject.next('end');
     });
     subject.subscribe(value => { });
     subject.next('start');
 * ```
 * When `subject` is a standard `Subject<T>` the second subscriber would recieve `end` and then `start`.
 * When `subject` is a `OrderedSubject<T>` the second subscriber would recieve `start` and then `end`.
 */
class OrderedSubject extends Subject {
    constructor() {
        super(...arguments);
        this._itemQueue = [];
        this._busyPushingNext = false;
    }
    next(value) {
        if (this._busyPushingNext) {
            this._itemQueue.unshift(value);
            return;
        }
        this._busyPushingNext = true;
        super.next(value);
        while (this._itemQueue.length > 0) {
            const nextValue = this._itemQueue.pop();
            super.next(nextValue);
        }
        this._busyPushingNext = false;
    }
}
/**
 * Internal Action stream that is emitted anytime an action is dispatched.
 */
class InternalActions extends OrderedSubject {
}
InternalActions.decorators = [
    { type: Injectable },
];
/**
 * Action stream that is emitted anytime an action is dispatched.
 *
 * You can listen to this in services to react without stores.
 */
class Actions extends Observable {
    constructor(actions$, ngZone) {
        super(observer => {
            actions$
                .pipe(enterZone(ngZone))
                .subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());
        });
    }
}
Actions.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Actions.ctorParameters = () => [
    { type: InternalActions, },
    { type: NgZone, },
];

/**
 * Composes a array of functions from left to right. Example:
 *
 *      compose([fn, final])(state, action);
 *
 * then the funcs have a signature like:
 *
 *      function fn (state, action, next) {
 *          console.log('here', state, action, next);
 *          return next(state, action);
 *      }
 *
 *      function final (state, action) {
 *          console.log('here', state, action);
 *          return state;
 *      }
 *
 * the last function should not call `next`.
 *
 * @ignore
 */
const compose = funcs => (...args) => {
    const curr = funcs.shift();
    return curr(...args, (...nextArgs) => compose(funcs)(...nextArgs));
};

/**
 * BehaviorSubject of the entire state.
 * @ignore
 */
class StateStream extends BehaviorSubject {
    constructor() {
        super({});
    }
}
StateStream.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateStream.ctorParameters = () => [];

/**
 * Plugin manager class
 * @ignore
 */
class PluginManager {
    constructor(_parentManager, _plugins) {
        this._parentManager = _parentManager;
        this._plugins = _plugins;
        this.plugins = [];
        this.register();
    }
    register() {
        if (!this._plugins) {
            return;
        }
        this.plugins = this._plugins.map(plugin => {
            if (plugin.handle) {
                return plugin.handle.bind(plugin);
            }
            else {
                return plugin;
            }
        });
        if (this._parentManager) {
            this._parentManager.plugins.push(...this.plugins);
        }
    }
}
PluginManager.decorators = [
    { type: Injectable },
];
/** @nocollapse */
PluginManager.ctorParameters = () => [
    { type: PluginManager, decorators: [{ type: Optional }, { type: SkipSelf },] },
    { type: Array, decorators: [{ type: Inject, args: [NGXS_PLUGINS,] }, { type: Optional },] },
];

/**
 * Internal Action result stream that is emitted when an action is completed.
 * This is used as a method of returning the action result to the dispatcher
 * for the observable returned by the dispatch(...) call.
 * The dispatcher then asynchronously pushes the result from this stream onto the main action stream as a result.
 */
class InternalDispatchedActionResults extends Subject {
}
InternalDispatchedActionResults.decorators = [
    { type: Injectable },
];
class InternalDispatcher {
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

/**
 * Object freeze code
 * https://github.com/jsdf/deep-freeze
 */
const deepFreeze = o => {
    Object.freeze(o);
    const oIsFunction = typeof o === 'function';
    const hasOwnProp = Object.prototype.hasOwnProperty;
    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (hasOwnProp.call(o, prop) &&
            (oIsFunction ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments' : true) &&
            o[prop] !== null &&
            (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
            !Object.isFrozen(o[prop])) {
            deepFreeze(o[prop]);
        }
    });
    return o;
};

/**
 * State Context factory class
 * @ignore
 */
class InternalStateOperations {
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

/**
 * State Context factory class
 * @ignore
 */
class StateContextFactory {
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

/**
 * State factory class
 * @ignore
 */
class StateFactory {
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

function defaultEqualityCheck(a, b) {
    return a === b;
}
function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
        return false;
    }
    // Do this in a for loop (and not a `forEach` or an `every`) so we can determine equality as fast as possible.
    const length = prev.length;
    for (let i = 0; i < length; i++) {
        if (!equalityCheck(prev[i], next[i])) {
            return false;
        }
    }
    return true;
}
/**
 * Memoize a function on its last inputs only.
 * Oringinally from: https://github.com/reduxjs/reselect/blob/master/src/index.js
 *
 * @ignore
 */
function memoize(func, equalityCheck = defaultEqualityCheck) {
    let lastArgs = null;
    let lastResult = null;
    // we reference arguments instead of spreading them for performance reasons
    return function memoized() {
        if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
            // apply arguments instead of spreading for performance.
            lastResult = func.apply(null, arguments);
        }
        lastArgs = arguments;
        return lastResult;
    };
}

/**
 * Function for creating a selector
 * @param selectors The selectors to use to create the arguments of this function
 * @param originalFn The original function being made into a selector
 */
function createSelector(selectors, originalFn, creationMetadata) {
    const wrappedFn = function wrappedSelectorFn(...args) {
        const returnValue = originalFn(...args);
        if (returnValue instanceof Function) {
            const innerMemoizedFn = memoize.apply(null, [returnValue]);
            return innerMemoizedFn;
        }
        return returnValue;
    };
    const memoizedFn = memoize(wrappedFn);
    const containerClass = creationMetadata && creationMetadata.containerClass;
    const fn = state => {
        const results = [];
        const selectorsToApply = [];
        if (containerClass) {
            // If we are on a state class, add it as the first selector parameter
            const metadata = getStoreMetadata(containerClass);
            if (metadata) {
                selectorsToApply.push(containerClass);
            }
        }
        if (selectors) {
            selectorsToApply.push(...selectors);
        }
        // Determine arguments from the app state using the selectors
        if (selectorsToApply) {
            results.push(...selectorsToApply.map(a => getSelectorFn(a)(state)));
        }
        // if the lambda tries to access a something on the
        // state that doesn't exist, it will throw a TypeError.
        // since this is quite usual behaviour, we simply return undefined if so.
        try {
            return memoizedFn(...results);
        }
        catch (ex) {
            if (ex instanceof TypeError) {
                return undefined;
            }
            throw ex;
        }
    };
    const selectorMetaData = ensureSelectorMetadata(memoizedFn);
    selectorMetaData.originalFn = originalFn;
    selectorMetaData.selectFromAppState = fn;
    if (creationMetadata) {
        selectorMetaData.containerClass = creationMetadata.containerClass;
        selectorMetaData.selectorName = creationMetadata.selectorName;
    }
    return memoizedFn;
}
/**
 * This function gets the selector function to be used to get the selected slice from the app state
 * @ignore
 */
function getSelectorFn(selector) {
    const selectorMetadata = getSelectorMetadata(selector);
    if (selectorMetadata) {
        const selectFromAppState = selectorMetadata.selectFromAppState;
        if (selectFromAppState) {
            return selectFromAppState;
        }
    }
    const stateMetadata = getStoreMetadata(selector);
    if (stateMetadata && stateMetadata.path) {
        return fastPropGetter(stateMetadata.path.split('.'));
    }
    return selector;
}

class Store {
    constructor(_ngZone, _stateStream, _internalStateOperations) {
        this._ngZone = _ngZone;
        this._stateStream = _stateStream;
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Dispatches event(s).
       */
    dispatch(event) {
        return this._internalStateOperations.getRootStateOperations().dispatch(event);
    }
    select(selector) {
        const selectorFn = getSelectorFn(selector);
        return this._stateStream.pipe(map(selectorFn), catchError(err => {
            // if error is TypeError we swallow it to prevent usual errors with property access
            if (err instanceof TypeError) {
                return of(undefined);
            }
            // rethrow other errors
            throw err;
        }), distinctUntilChanged(), enterZone(this._ngZone));
    }
    selectOnce(selector) {
        return this.select(selector).pipe(take(1));
    }
    selectSnapshot(selector) {
        const selectorFn = getSelectorFn(selector);
        return selectorFn(this._stateStream.getValue());
    }
    /**
       * Allow the user to subscribe to the root of the state
       */
    subscribe(fn) {
        return this._stateStream.pipe(enterZone(this._ngZone)).subscribe(fn);
    }
    /**
       * Return the raw value of the state.
       */
    snapshot() {
        return this._internalStateOperations.getRootStateOperations().getState();
    }
    /**
       * Reset the state to a specific point in time. This method is useful
       * for plugin's who need to modify the state directly or unit testing.
       */
    reset(state) {
        return this._internalStateOperations.getRootStateOperations().setState(state);
    }
}
Store.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Store.ctorParameters = () => [
    { type: NgZone, },
    { type: StateStream, },
    { type: InternalStateOperations, },
];

/**
 * Allows the select decorator to get access to the DI store.
 * @ignore
 */
class SelectFactory {
    constructor(store) {
        SelectFactory.store = store;
    }
}
SelectFactory.store = undefined;
SelectFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SelectFactory.ctorParameters = () => [
    { type: Store, },
];
/**
 * Decorator for selecting a slice of state from the store.
 */
function Select(selectorOrFeature, ...paths) {
    return function (target, name) {
        const selectorFnName = '__' + name + '__selector';
        if (!selectorOrFeature) {
            // if foo$ => make it just foo
            selectorOrFeature = name.lastIndexOf('$') === name.length - 1 ? name.substring(0, name.length - 1) : name;
        }
        const createSelect = fn => {
            const store = SelectFactory.store;
            if (!store) {
                throw new Error('SelectFactory not connected to store!');
            }
            return store.select(fn);
        };
        const createSelector = () => {
            if (typeof selectorOrFeature === 'string') {
                const propsArray = paths.length ? [selectorOrFeature, ...paths] : selectorOrFeature.split('.');
                return fastPropGetter(propsArray);
            }
            else if (selectorOrFeature[META_KEY] && selectorOrFeature[META_KEY].path) {
                return fastPropGetter(selectorOrFeature[META_KEY].path.split('.'));
            }
            else {
                return selectorOrFeature;
            }
        };
        if (target[selectorFnName]) {
            throw new Error('You cannot use @Select decorator and a ' + selectorFnName + ' property.');
        }
        if (delete target[name]) {
            Object.defineProperty(target, selectorFnName, {
                writable: true,
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(target, name, {
                get: function () {
                    return this[selectorFnName] || (this[selectorFnName] = createSelect.apply(this, [createSelector()]));
                },
                enumerable: true,
                configurable: true
            });
        }
    };
}

/**
 * Init action
 */
class InitState {
}
InitState.type = '@@INIT';
/**
 * Update action
 */
class UpdateState {
}
UpdateState.type = '@@UPDATE_STATE';

/**
 * Root module
 * @ignore
 */
class NgxsRootModule {
    constructor(factory, internalStateOperations, store, select, states) {
        // add stores to the state graph and return their defaults
        const results = factory.addAndReturnDefaults(states);
        const stateOperations = internalStateOperations.getRootStateOperations();
        if (results) {
            // get our current stream
            const cur = stateOperations.getState();
            // set the state to the current + new
            stateOperations.setState(Object.assign({}, cur, results.defaults));
        }
        // connect our actions stream
        factory.connectActionHandlers();
        // dispatch the init action and invoke init function after
        stateOperations.dispatch(new InitState()).subscribe(() => {
            if (results) {
                factory.invokeInit(results.states);
            }
        });
    }
}
NgxsRootModule.decorators = [
    { type: NgModule },
];
/** @nocollapse */
NgxsRootModule.ctorParameters = () => [
    { type: StateFactory, },
    { type: InternalStateOperations, },
    { type: Store, },
    { type: SelectFactory, },
    { type: Array, decorators: [{ type: Optional }, { type: Inject, args: [ROOT_STATE_TOKEN,] },] },
];
/**
 * Feature module
 * @ignore
 */
class NgxsFeatureModule {
    constructor(store, internalStateOperations, factory, states) {
        // Since FEATURE_STATE_TOKEN is a multi token, we need to
        // flatten it [[Feature1State, Feature2State], [Feature3State]]
        const flattenedStates = [].concat(...states);
        // add stores to the state graph and return their defaults
        const results = factory.addAndReturnDefaults(flattenedStates);
        const stateOperations = internalStateOperations.getRootStateOperations();
        if (results) {
            // get our current stream
            const cur = stateOperations.getState();
            // set the state to the current + new
            stateOperations.setState(Object.assign({}, cur, results.defaults));
        }
        stateOperations.dispatch(new UpdateState()).subscribe(() => {
            if (results) {
                factory.invokeInit(results.states);
            }
        });
    }
}
NgxsFeatureModule.decorators = [
    { type: NgModule, args: [{},] },
];
/** @nocollapse */
NgxsFeatureModule.ctorParameters = () => [
    { type: Store, },
    { type: InternalStateOperations, },
    { type: StateFactory, },
    { type: Array, decorators: [{ type: Optional }, { type: Inject, args: [FEATURE_STATE_TOKEN,] },] },
];
function ngxsConfigFactory(options) {
    const config = Object.assign(new NgxsConfig(), options);
    return config;
}
const ROOT_OPTIONS = new InjectionToken('ROOT_OPTIONS');
/**
 * Ngxs Module
 */
class NgxsModule {
    /**
       * Root module factory
       */
    static forRoot(states = [], options = {}) {
        return {
            ngModule: NgxsRootModule,
            providers: [
                StateFactory,
                StateContextFactory,
                Actions,
                InternalActions,
                InternalDispatcher,
                InternalDispatchedActionResults,
                InternalStateOperations,
                Store,
                StateStream,
                SelectFactory,
                PluginManager,
                ...states,
                {
                    provide: ROOT_STATE_TOKEN,
                    useValue: states
                },
                {
                    provide: ROOT_OPTIONS,
                    useValue: options
                },
                {
                    provide: NgxsConfig,
                    useFactory: ngxsConfigFactory,
                    deps: [ROOT_OPTIONS]
                }
            ]
        };
    }
    /**
       * Feature module factory
       */
    static forFeature(states) {
        return {
            ngModule: NgxsFeatureModule,
            providers: [
                StateFactory,
                PluginManager,
                ...states,
                {
                    provide: FEATURE_STATE_TOKEN,
                    multi: true,
                    useValue: states
                }
            ]
        };
    }
}
NgxsModule.decorators = [
    { type: NgModule, args: [{},] },
];

/**
 * Decorates a method with a action information.
 */
function Action(actions, options) {
    return function (target, name, descriptor) {
        const meta = ensureStoreMetadata(target.constructor);
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        for (const action of actions) {
            const type = action.type;
            if (!action.type) {
                throw new Error(`Action ${action.name} is missing a static "type" property`);
            }
            if (!meta.actions[type]) {
                meta.actions[type] = [];
            }
            meta.actions[type].push({
                fn: name,
                options: options || {},
                type
            });
        }
    };
}

const stateNameRegex = new RegExp('^[a-zA-Z0-9]+$');
/**
 * Error message
 * @ignore
 */
const stateNameErrorMessage = name => `${name} is not a valid state name. It needs to be a valid object property name.`;
/**
 * Decorates a class with ngxs state information.
 */
function State(options) {
    return function (target) {
        const meta = ensureStoreMetadata(target);
        // Handle inheritance
        if (Object.getPrototypeOf(target).hasOwnProperty(META_KEY)) {
            const parentMeta = Object.getPrototypeOf(target)[META_KEY];
            meta.actions = Object.assign({}, meta.actions, parentMeta.actions);
        }
        meta.children = options.children;
        meta.defaults = options.defaults;
        meta.name = options.name;
        if (!options.name) {
            throw new Error(`States must register a 'name' property`);
        }
        if (!stateNameRegex.test(options.name)) {
            throw new Error(stateNameErrorMessage(options.name));
        }
    };
}

/**
 * Decorator for memoizing a state selector.
 */
function Selector(selectors) {
    return (target, key, descriptor) => {
        if (descriptor.value !== null) {
            const originalFn = descriptor.value;
            const memoizedFn = createSelector(selectors, originalFn, { containerClass: target, selectorName: key });
            return {
                configurable: true,
                get() {
                    return memoizedFn;
                }
            };
        }
        else {
            throw new Error('Selectors only work on methods');
        }
    };
}

/**
 * The public api for consumers of @ngxs/store
 */

/**
 * Generated bundle index. Do not edit.
 */

export { InternalActions as ɵg, OrderedSubject as ɵf, SelectFactory as ɵe, InternalDispatchedActionResults as ɵl, InternalDispatcher as ɵm, StateContextFactory as ɵn, StateFactory as ɵk, InternalStateOperations as ɵo, NgxsFeatureModule as ɵb, NgxsRootModule as ɵa, ROOT_OPTIONS as ɵd, ngxsConfigFactory as ɵc, PluginManager as ɵp, FEATURE_STATE_TOKEN as ɵi, NgxsConfig as ɵj, ROOT_STATE_TOKEN as ɵh, NgxsModule, Action, Store, State, Select, Actions, ofAction, ofActionDispatched, ofActionSuccessful, ofActionCanceled, ofActionErrored, Selector, getActionTypeFromInstance, actionMatcher, createSelector, NGXS_PLUGINS, StateStream, setValue, getValue, InitState, UpdateState };
//# sourceMappingURL=ngxs-store.js.map
