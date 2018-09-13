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
export class NgxsRootModule {
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
export class NgxsFeatureModule {
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
export function ngxsConfigFactory(options) {
    const config = Object.assign(new NgxsConfig(), options);
    return config;
}
export const ROOT_OPTIONS = new InjectionToken('ROOT_OPTIONS');
/**
 * Ngxs Module
 */
export class NgxsModule {
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
//# sourceMappingURL=module.js.map
