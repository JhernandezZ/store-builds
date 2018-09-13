import { InjectionToken, Injectable, NgZone, Optional, SkipSelf, Inject, ErrorHandler, Injector, NgModule } from '@angular/core';
import { map, filter, shareReplay, exhaustMap, take, takeUntil, catchError, mergeMap, defaultIfEmpty, distinctUntilChanged } from 'rxjs/operators';
import { Observable, Subject, BehaviorSubject, of, forkJoin, empty, throwError, from } from 'rxjs';
import { __spread, __values, __extends } from 'tslib';

var ROOT_STATE_TOKEN = new InjectionToken('ROOT_STATE_TOKEN');
var FEATURE_STATE_TOKEN = new InjectionToken('FEATURE_STATE_TOKEN');
var META_KEY = 'NGXS_META';
var SELECTOR_META_KEY = 'NGXS_SELECTOR_META';
var NGXS_PLUGINS = new InjectionToken('NGXS_PLUGINS');
/**
 * The NGXS config settings.
 */
var NgxsConfig = /** @class */ (function () {
    function NgxsConfig() {
    }
    return NgxsConfig;
}());

/**
 * Ensures metadata is attached to the class and returns it.
 *
 * @ignore
 */
function ensureStoreMetadata(target) {
    if (!target.hasOwnProperty(META_KEY)) {
        var defaultMetadata = {
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
        var defaultMetadata = {
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
    var segments = paths;
    var seg = 'store.' + segments[0];
    var i = 0;
    var l = segments.length;
    var expr = seg;
    while (++i < l) {
        expr = expr + ' && ' + (seg = seg + '.' + segments[i]);
    }
    var fn = new Function('store', 'return ' + expr + ';');
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
    var findName = function (stateClass) {
        var meta = stateClasses.find(function (g) { return g === stateClass; });
        if (!meta) {
            throw new Error("Child state not found: " + stateClass);
        }
        if (!meta[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        return meta[META_KEY].name;
    };
    return stateClasses.reduce(function (result, stateClass) {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        var _a = stateClass[META_KEY], name = _a.name, children = _a.children;
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
    return states.reduce(function (result, stateClass) {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        var meta = stateClass[META_KEY];
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
function findFullParentPath(obj, newObj) {
    if (newObj === void 0) { newObj = {}; }
    var visit = function (child, keyToFind) {
        for (var key in child) {
            if (child.hasOwnProperty(key) && child[key].indexOf(keyToFind) >= 0) {
                var parent_1 = visit(child, key);
                return parent_1 !== null ? parent_1 + "." + key : key;
            }
        }
        return null;
    };
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var parent_2 = visit(obj, key);
            newObj[key] = parent_2 ? parent_2 + "." + key : key;
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
    var sorted = [];
    var visited = {};
    var visit = function (name, ancestors) {
        if (ancestors === void 0) { ancestors = []; }
        if (!Array.isArray(ancestors)) {
            ancestors = [];
        }
        ancestors.push(name);
        visited[name] = true;
        graph[name].forEach(function (dep) {
            if (ancestors.indexOf(dep) >= 0) {
                throw new Error("Circular dependency '" + dep + "' is required by '" + name + "': " + ancestors.join(' -> '));
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
    Object.keys(graph).forEach(function (k) { return visit(k); });
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
    var type1 = getActionTypeFromInstance(action1);
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
var setValue = function (obj, prop, val) {
    obj = Object.assign({}, obj);
    var split = prop.split('.');
    var lastIndex = split.length - 1;
    split.reduce(function (acc, part, index) {
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
var getValue = function (obj, prop) { return prop.split('.').reduce(function (acc, part) { return acc && acc[part]; }, obj); };

/**
 * RxJS operator for selecting out specific actions.
 *
 * This will grab actions that have just been dispatched as well as actions that have completed
 */
function ofAction() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been dispatched
 */
function ofActionDispatched() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "DISPATCHED" /* Dispatched */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been successfully completed
 */
function ofActionSuccessful() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "SUCCESSFUL" /* Successful */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been canceled
 */
function ofActionCanceled() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "CANCELED" /* Canceled */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just thrown an error
 */
function ofActionErrored() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "ERRORED" /* Errored */);
}
function ofActionOperator(allowedTypes, status) {
    var allowedMap = createAllowedMap(allowedTypes);
    return function (o) {
        return o.pipe(filterStatus(allowedMap, status), mapAction());
    };
}
function filterStatus(allowedTypes, status) {
    return filter(function (ctx) {
        var actionType = getActionTypeFromInstance(ctx.action);
        var type = allowedTypes[actionType];
        return status ? type && ctx.status === status : type;
    });
}
function mapAction() {
    return map(function (ctx) { return ctx.action; });
}
function createAllowedMap(types) {
    return types.reduce(function (acc, klass) {
        acc[getActionTypeFromInstance(klass)] = true;
        return acc;
    }, {});
}

/**
 * Operator to run the `subscribe` in a Angular zone.
 */
function enterZone(zone) {
    return function (source) {
        return new Observable(function (sink) {
            return source.subscribe({
                next: function (x) {
                    zone.run(function () { return sink.next(x); });
                },
                error: function (e) {
                    zone.run(function () { return sink.error(e); });
                },
                complete: function () {
                    zone.run(function () { return sink.complete(); });
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
var OrderedSubject = /** @class */ (function (_super) {
    __extends(OrderedSubject, _super);
    function OrderedSubject() {
        var _this = _super.apply(this, __spread(arguments)) || this;
        _this._itemQueue = [];
        _this._busyPushingNext = false;
        return _this;
    }
    OrderedSubject.prototype.next = function (value) {
        if (this._busyPushingNext) {
            this._itemQueue.unshift(value);
            return;
        }
        this._busyPushingNext = true;
        _super.prototype.next.call(this, value);
        while (this._itemQueue.length > 0) {
            var nextValue = this._itemQueue.pop();
            _super.prototype.next.call(this, nextValue);
        }
        this._busyPushingNext = false;
    };
    return OrderedSubject;
}(Subject));
/**
 * Internal Action stream that is emitted anytime an action is dispatched.
 */
var InternalActions = /** @class */ (function (_super) {
    __extends(InternalActions, _super);
    function InternalActions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InternalActions;
}(OrderedSubject));
InternalActions.decorators = [
    { type: Injectable },
];
/**
 * Action stream that is emitted anytime an action is dispatched.
 *
 * You can listen to this in services to react without stores.
 */
var Actions = /** @class */ (function (_super) {
    __extends(Actions, _super);
    function Actions(actions$, ngZone) {
        return _super.call(this, function (observer) {
            actions$
                .pipe(enterZone(ngZone))
                .subscribe(function (res) { return observer.next(res); }, function (err) { return observer.error(err); }, function () { return observer.complete(); });
        }) || this;
    }
    return Actions;
}(Observable));
Actions.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Actions.ctorParameters = function () { return [
    { type: InternalActions, },
    { type: NgZone, },
]; };

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
var compose = function (funcs) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var curr = funcs.shift();
    return curr.apply(void 0, __spread(args, [function () {
            var nextArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nextArgs[_i] = arguments[_i];
            }
            return compose(funcs).apply(void 0, __spread(nextArgs));
        }]));
}; };

/**
 * BehaviorSubject of the entire state.
 * @ignore
 */
var StateStream = /** @class */ (function (_super) {
    __extends(StateStream, _super);
    function StateStream() {
        return _super.call(this, {}) || this;
    }
    return StateStream;
}(BehaviorSubject));
StateStream.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateStream.ctorParameters = function () { return []; };

/**
 * Plugin manager class
 * @ignore
 */
var PluginManager = /** @class */ (function () {
    function PluginManager(_parentManager, _plugins) {
        this._parentManager = _parentManager;
        this._plugins = _plugins;
        this.plugins = [];
        this.register();
    }
    PluginManager.prototype.register = function () {
        if (!this._plugins) {
            return;
        }
        this.plugins = this._plugins.map(function (plugin) {
            if (plugin.handle) {
                return plugin.handle.bind(plugin);
            }
            else {
                return plugin;
            }
        });
        if (this._parentManager) {
            (_a = this._parentManager.plugins).push.apply(_a, __spread(this.plugins));
        }
        var _a;
    };
    return PluginManager;
}());
PluginManager.decorators = [
    { type: Injectable },
];
/** @nocollapse */
PluginManager.ctorParameters = function () { return [
    { type: PluginManager, decorators: [{ type: Optional }, { type: SkipSelf },] },
    { type: Array, decorators: [{ type: Inject, args: [NGXS_PLUGINS,] }, { type: Optional },] },
]; };

/**
 * Internal Action result stream that is emitted when an action is completed.
 * This is used as a method of returning the action result to the dispatcher
 * for the observable returned by the dispatch(...) call.
 * The dispatcher then asynchronously pushes the result from this stream onto the main action stream as a result.
 */
var InternalDispatchedActionResults = /** @class */ (function (_super) {
    __extends(InternalDispatchedActionResults, _super);
    function InternalDispatchedActionResults() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InternalDispatchedActionResults;
}(Subject));
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
        return compose(__spread(plugins, [
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

/**
 * Object freeze code
 * https://github.com/jsdf/deep-freeze
 */
var deepFreeze = function (o) {
    Object.freeze(o);
    var oIsFunction = typeof o === 'function';
    var hasOwnProp = Object.prototype.hasOwnProperty;
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
var InternalStateOperations = /** @class */ (function () {
    function InternalStateOperations(_stateStream, _dispatcher, _config) {
        this._stateStream = _stateStream;
        this._dispatcher = _dispatcher;
        this._config = _config;
    }
    /**
       * Returns the root state operators.
       */
    InternalStateOperations.prototype.getRootStateOperations = function () {
        var _this = this;
        var rootStateOperations = {
            getState: function () { return _this._stateStream.getValue(); },
            setState: function (newState) { return _this._stateStream.next(newState); },
            dispatch: function (actions) { return _this._dispatcher.dispatch(actions); }
        };
        if (this._config.developmentMode) {
            return this.ensureStateAndActionsAreImmutable(rootStateOperations);
        }
        return rootStateOperations;
    };
    InternalStateOperations.prototype.ensureStateAndActionsAreImmutable = function (root) {
        return {
            getState: function () { return root.getState(); },
            setState: function (value) {
                var frozenValue = deepFreeze(value);
                return root.setState(frozenValue);
            },
            dispatch: function (actions) {
                return root.dispatch(actions);
            }
        };
    };
    return InternalStateOperations;
}());
InternalStateOperations.decorators = [
    { type: Injectable },
];
/** @nocollapse */
InternalStateOperations.ctorParameters = function () { return [
    { type: StateStream, },
    { type: InternalDispatcher, },
    { type: NgxsConfig, },
]; };

/**
 * State Context factory class
 * @ignore
 */
var StateContextFactory = /** @class */ (function () {
    function StateContextFactory(_internalStateOperations) {
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Create the state context
       */
    StateContextFactory.prototype.createStateContext = function (metadata) {
        var root = this._internalStateOperations.getRootStateOperations();
        return {
            getState: function () {
                var state = root.getState();
                return getValue(state, metadata.depth);
            },
            patchState: function (val) {
                var isArray = Array.isArray(val);
                var isPrimitive = typeof val !== 'object';
                if (isArray) {
                    throw new Error('Patching arrays is not supported.');
                }
                else if (isPrimitive) {
                    throw new Error('Patching primitives is not supported.');
                }
                var state = root.getState();
                var local = getValue(state, metadata.depth);
                var clone = Object.assign({}, local);
                for (var k in val) {
                    clone[k] = val[k];
                }
                var newState = setValue(state, metadata.depth, clone);
                root.setState(newState);
                return newState;
            },
            setState: function (val) {
                var state = root.getState();
                state = setValue(state, metadata.depth, val);
                root.setState(state);
                return state;
            },
            dispatch: function (actions) {
                return root.dispatch(actions);
            }
        };
    };
    return StateContextFactory;
}());
StateContextFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateContextFactory.ctorParameters = function () { return [
    { type: InternalStateOperations, },
]; };

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
                    defaults = __spread(defaults);
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
            for (var sortedStates_1 = __values(sortedStates), sortedStates_1_1 = sortedStates_1.next(); !sortedStates_1_1.done; sortedStates_1_1 = sortedStates_1.next()) {
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
        (_b = this.states).push.apply(_b, __spread(mappedStores));
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
            for (var stateMetadatas_1 = __values(stateMetadatas), stateMetadatas_1_1 = stateMetadatas_1.next(); !stateMetadatas_1_1.done; stateMetadatas_1_1 = stateMetadatas_1.next()) {
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
            for (var _a = __values(this.states), _b = _a.next(); !_b.done; _b = _a.next()) {
                var metadata = _b.value;
                var type = getActionTypeFromInstance(action);
                var actionMetas = metadata.actions[type];
                if (actionMetas) {
                    try {
                        for (var actionMetas_1 = __values(actionMetas), actionMetas_1_1 = actionMetas_1.next(); !actionMetas_1_1.done; actionMetas_1_1 = actionMetas_1.next()) {
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

function defaultEqualityCheck(a, b) {
    return a === b;
}
function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
        return false;
    }
    // Do this in a for loop (and not a `forEach` or an `every`) so we can determine equality as fast as possible.
    var length = prev.length;
    for (var i = 0; i < length; i++) {
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
function memoize(func, equalityCheck) {
    if (equalityCheck === void 0) { equalityCheck = defaultEqualityCheck; }
    var lastArgs = null;
    var lastResult = null;
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
    var wrappedFn = function wrappedSelectorFn() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var returnValue = originalFn.apply(void 0, __spread(args));
        if (returnValue instanceof Function) {
            var innerMemoizedFn = memoize.apply(null, [returnValue]);
            return innerMemoizedFn;
        }
        return returnValue;
    };
    var memoizedFn = memoize(wrappedFn);
    var containerClass = creationMetadata && creationMetadata.containerClass;
    var fn = function (state) {
        var results = [];
        var selectorsToApply = [];
        if (containerClass) {
            // If we are on a state class, add it as the first selector parameter
            var metadata = getStoreMetadata(containerClass);
            if (metadata) {
                selectorsToApply.push(containerClass);
            }
        }
        if (selectors) {
            selectorsToApply.push.apply(selectorsToApply, __spread(selectors));
        }
        // Determine arguments from the app state using the selectors
        if (selectorsToApply) {
            results.push.apply(results, __spread(selectorsToApply.map(function (a) { return getSelectorFn(a)(state); })));
        }
        // if the lambda tries to access a something on the
        // state that doesn't exist, it will throw a TypeError.
        // since this is quite usual behaviour, we simply return undefined if so.
        try {
            return memoizedFn.apply(void 0, __spread(results));
        }
        catch (ex) {
            if (ex instanceof TypeError) {
                return undefined;
            }
            throw ex;
        }
    };
    var selectorMetaData = ensureSelectorMetadata(memoizedFn);
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
    var selectorMetadata = getSelectorMetadata(selector);
    if (selectorMetadata) {
        var selectFromAppState = selectorMetadata.selectFromAppState;
        if (selectFromAppState) {
            return selectFromAppState;
        }
    }
    var stateMetadata = getStoreMetadata(selector);
    if (stateMetadata && stateMetadata.path) {
        return fastPropGetter(stateMetadata.path.split('.'));
    }
    return selector;
}

var Store = /** @class */ (function () {
    function Store(_ngZone, _stateStream, _internalStateOperations) {
        this._ngZone = _ngZone;
        this._stateStream = _stateStream;
        this._internalStateOperations = _internalStateOperations;
    }
    /**
       * Dispatches event(s).
       */
    Store.prototype.dispatch = function (event) {
        return this._internalStateOperations.getRootStateOperations().dispatch(event);
    };
    Store.prototype.select = function (selector) {
        var selectorFn = getSelectorFn(selector);
        return this._stateStream.pipe(map(selectorFn), catchError(function (err) {
            // if error is TypeError we swallow it to prevent usual errors with property access
            if (err instanceof TypeError) {
                return of(undefined);
            }
            // rethrow other errors
            throw err;
        }), distinctUntilChanged(), enterZone(this._ngZone));
    };
    Store.prototype.selectOnce = function (selector) {
        return this.select(selector).pipe(take(1));
    };
    Store.prototype.selectSnapshot = function (selector) {
        var selectorFn = getSelectorFn(selector);
        return selectorFn(this._stateStream.getValue());
    };
    /**
       * Allow the user to subscribe to the root of the state
       */
    Store.prototype.subscribe = function (fn) {
        return this._stateStream.pipe(enterZone(this._ngZone)).subscribe(fn);
    };
    /**
       * Return the raw value of the state.
       */
    Store.prototype.snapshot = function () {
        return this._internalStateOperations.getRootStateOperations().getState();
    };
    /**
       * Reset the state to a specific point in time. This method is useful
       * for plugin's who need to modify the state directly or unit testing.
       */
    Store.prototype.reset = function (state) {
        return this._internalStateOperations.getRootStateOperations().setState(state);
    };
    return Store;
}());
Store.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Store.ctorParameters = function () { return [
    { type: NgZone, },
    { type: StateStream, },
    { type: InternalStateOperations, },
]; };

/**
 * Allows the select decorator to get access to the DI store.
 * @ignore
 */
var SelectFactory = /** @class */ (function () {
    function SelectFactory(store) {
        SelectFactory.store = store;
    }
    return SelectFactory;
}());
SelectFactory.store = undefined;
SelectFactory.decorators = [
    { type: Injectable },
];
/** @nocollapse */
SelectFactory.ctorParameters = function () { return [
    { type: Store, },
]; };
/**
 * Decorator for selecting a slice of state from the store.
 */
function Select(selectorOrFeature) {
    var paths = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        paths[_i - 1] = arguments[_i];
    }
    return function (target, name) {
        var selectorFnName = '__' + name + '__selector';
        if (!selectorOrFeature) {
            // if foo$ => make it just foo
            selectorOrFeature = name.lastIndexOf('$') === name.length - 1 ? name.substring(0, name.length - 1) : name;
        }
        var createSelect = function (fn) {
            var store = SelectFactory.store;
            if (!store) {
                throw new Error('SelectFactory not connected to store!');
            }
            return store.select(fn);
        };
        var createSelector = function () {
            if (typeof selectorOrFeature === 'string') {
                var propsArray = paths.length ? __spread([selectorOrFeature], paths) : selectorOrFeature.split('.');
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
var InitState = /** @class */ (function () {
    function InitState() {
    }
    return InitState;
}());
InitState.type = '@@INIT';
/**
 * Update action
 */
var UpdateState = /** @class */ (function () {
    function UpdateState() {
    }
    return UpdateState;
}());
UpdateState.type = '@@UPDATE_STATE';

/**
 * Root module
 * @ignore
 */
var NgxsRootModule = /** @class */ (function () {
    function NgxsRootModule(factory, internalStateOperations, store, select, states) {
        // add stores to the state graph and return their defaults
        var results = factory.addAndReturnDefaults(states);
        var stateOperations = internalStateOperations.getRootStateOperations();
        if (results) {
            // get our current stream
            var cur = stateOperations.getState();
            // set the state to the current + new
            stateOperations.setState(Object.assign({}, cur, results.defaults));
        }
        // connect our actions stream
        factory.connectActionHandlers();
        // dispatch the init action and invoke init function after
        stateOperations.dispatch(new InitState()).subscribe(function () {
            if (results) {
                factory.invokeInit(results.states);
            }
        });
    }
    return NgxsRootModule;
}());
NgxsRootModule.decorators = [
    { type: NgModule },
];
/** @nocollapse */
NgxsRootModule.ctorParameters = function () { return [
    { type: StateFactory, },
    { type: InternalStateOperations, },
    { type: Store, },
    { type: SelectFactory, },
    { type: Array, decorators: [{ type: Optional }, { type: Inject, args: [ROOT_STATE_TOKEN,] },] },
]; };
/**
 * Feature module
 * @ignore
 */
var NgxsFeatureModule = /** @class */ (function () {
    function NgxsFeatureModule(store, internalStateOperations, factory, states) {
        // Since FEATURE_STATE_TOKEN is a multi token, we need to
        // flatten it [[Feature1State, Feature2State], [Feature3State]]
        var flattenedStates = [].concat.apply([], __spread(states));
        // add stores to the state graph and return their defaults
        var results = factory.addAndReturnDefaults(flattenedStates);
        var stateOperations = internalStateOperations.getRootStateOperations();
        if (results) {
            // get our current stream
            var cur = stateOperations.getState();
            // set the state to the current + new
            stateOperations.setState(Object.assign({}, cur, results.defaults));
        }
        stateOperations.dispatch(new UpdateState()).subscribe(function () {
            if (results) {
                factory.invokeInit(results.states);
            }
        });
    }
    return NgxsFeatureModule;
}());
NgxsFeatureModule.decorators = [
    { type: NgModule, args: [{},] },
];
/** @nocollapse */
NgxsFeatureModule.ctorParameters = function () { return [
    { type: Store, },
    { type: InternalStateOperations, },
    { type: StateFactory, },
    { type: Array, decorators: [{ type: Optional }, { type: Inject, args: [FEATURE_STATE_TOKEN,] },] },
]; };
function ngxsConfigFactory(options) {
    var config = Object.assign(new NgxsConfig(), options);
    return config;
}
var ROOT_OPTIONS = new InjectionToken('ROOT_OPTIONS');
/**
 * Ngxs Module
 */
var NgxsModule = /** @class */ (function () {
    function NgxsModule() {
    }
    /**
       * Root module factory
       */
    NgxsModule.forRoot = function (states, options) {
        if (states === void 0) { states = []; }
        if (options === void 0) { options = {}; }
        return {
            ngModule: NgxsRootModule,
            providers: __spread([
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
                PluginManager
            ], states, [
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
            ])
        };
    };
    /**
       * Feature module factory
       */
    NgxsModule.forFeature = function (states) {
        return {
            ngModule: NgxsFeatureModule,
            providers: __spread([
                StateFactory,
                PluginManager
            ], states, [
                {
                    provide: FEATURE_STATE_TOKEN,
                    multi: true,
                    useValue: states
                }
            ])
        };
    };
    return NgxsModule;
}());
NgxsModule.decorators = [
    { type: NgModule, args: [{},] },
];

/**
 * Decorates a method with a action information.
 */
function Action(actions, options) {
    return function (target, name, descriptor) {
        var meta = ensureStoreMetadata(target.constructor);
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        try {
            for (var actions_1 = __values(actions), actions_1_1 = actions_1.next(); !actions_1_1.done; actions_1_1 = actions_1.next()) {
                var action = actions_1_1.value;
                var type = action.type;
                if (!action.type) {
                    throw new Error("Action " + action.name + " is missing a static \"type\" property");
                }
                if (!meta.actions[type]) {
                    meta.actions[type] = [];
                }
                meta.actions[type].push({
                    fn: name,
                    options: options || {},
                    type: type
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _a;
    };
}

var stateNameRegex = new RegExp('^[a-zA-Z0-9]+$');
/**
 * Error message
 * @ignore
 */
var stateNameErrorMessage = function (name) { return name + " is not a valid state name. It needs to be a valid object property name."; };
/**
 * Decorates a class with ngxs state information.
 */
function State(options) {
    return function (target) {
        var meta = ensureStoreMetadata(target);
        // Handle inheritance
        if (Object.getPrototypeOf(target).hasOwnProperty(META_KEY)) {
            var parentMeta = Object.getPrototypeOf(target)[META_KEY];
            meta.actions = Object.assign({}, meta.actions, parentMeta.actions);
        }
        meta.children = options.children;
        meta.defaults = options.defaults;
        meta.name = options.name;
        if (!options.name) {
            throw new Error("States must register a 'name' property");
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
    return function (target, key, descriptor) {
        if (descriptor.value !== null) {
            var originalFn = descriptor.value;
            var memoizedFn_1 = createSelector(selectors, originalFn, { containerClass: target, selectorName: key });
            return {
                configurable: true,
                get: function () {
                    return memoizedFn_1;
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
