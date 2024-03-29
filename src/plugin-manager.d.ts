import { NgxsPluginFn, NgxsPlugin } from './symbols';
/**
 * Plugin manager class
 * @ignore
 */
export declare class PluginManager {
    private _parentManager;
    private _plugins;
    plugins: NgxsPluginFn[];
    constructor(_parentManager: PluginManager, _plugins: NgxsPlugin[]);
    private register();
}
