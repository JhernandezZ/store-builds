import { ModuleWithProviders, InjectionToken } from '@angular/core';
import { NgxsConfig } from './symbols';
import { StateFactory } from './internal/state-factory';
import { InternalStateOperations } from './internal/state-operations';
import { Store } from './store';
import { SelectFactory } from './decorators/select';
/**
 * Root module
 * @ignore
 */
export declare class NgxsRootModule {
    constructor(factory: StateFactory, internalStateOperations: InternalStateOperations, store: Store, select: SelectFactory, states: any[]);
}
/**
 * Feature module
 * @ignore
 */
export declare class NgxsFeatureModule {
    constructor(store: Store, internalStateOperations: InternalStateOperations, factory: StateFactory, states: any[][]);
}
export declare type ModuleOptions = Partial<NgxsConfig>;
export declare function ngxsConfigFactory(options: ModuleOptions): NgxsConfig;
export declare const ROOT_OPTIONS: InjectionToken<{}>;
/**
 * Ngxs Module
 */
export declare class NgxsModule {
    /**
     * Root module factory
     */
    static forRoot(states?: any[], options?: ModuleOptions): ModuleWithProviders;
    /**
     * Feature module factory
     */
    static forFeature(states: any[]): ModuleWithProviders;
}
