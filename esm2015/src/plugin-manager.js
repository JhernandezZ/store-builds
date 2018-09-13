import { Injectable, Optional, SkipSelf, Inject } from '@angular/core';
import { NGXS_PLUGINS } from './symbols';
/**
 * Plugin manager class
 * @ignore
 */
export class PluginManager {
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
//# sourceMappingURL=plugin-manager.js.map
