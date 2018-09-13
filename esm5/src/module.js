import * as tslib_1 from "tslib";
import { NgModule, Optional, Inject, InjectionToken } from '@angular/core';
import { ROOT_STATE_TOKEN, FEATURE_STATE_TOKEN, NgxsConfig } from './symbols';
import { StateFactory } from './internal/state-factory';
import { StateContextFactory } from './internal/state-context-factory';
import { Actions, InternalActions } from './actions-stream';
import { InternalDispatcher, InternalDispatchedActionResults } from './internal/dispatcher';
import { InternalStateOperations } from './internal/state-operations';
import { Store } from './store';
import { SelectFactory } from './decorators/select';
import { StateStream } from './internal/state-stream';
import { PluginManager } from './plugin-manager';
import { InitState, UpdateState } from './actions/actions';
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
export { NgxsRootModule };
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
        var flattenedStates = [].concat.apply([], tslib_1.__spread(states));
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
export { NgxsFeatureModule };
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
export function ngxsConfigFactory(options) {
    var config = Object.assign(new NgxsConfig(), options);
    return config;
}
export var ROOT_OPTIONS = new InjectionToken('ROOT_OPTIONS');
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
            providers: tslib_1.__spread([
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
            providers: tslib_1.__spread([
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
export { NgxsModule };
NgxsModule.decorators = [
    { type: NgModule, args: [{},] },
];
//# sourceMappingURL=module.js.map
