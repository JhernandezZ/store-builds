import * as tslib_1 from "tslib";
import { Injectable, Optional, SkipSelf, Inject } from '@angular/core';
import { NGXS_PLUGINS } from './symbols';
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
            (_a = this._parentManager.plugins).push.apply(_a, tslib_1.__spread(this.plugins));
        }
        var _a;
    };
    return PluginManager;
}());
export { PluginManager };
PluginManager.decorators = [
    { type: Injectable },
];
/** @nocollapse */
PluginManager.ctorParameters = function () { return [
    { type: PluginManager, decorators: [{ type: Optional }, { type: SkipSelf },] },
    { type: Array, decorators: [{ type: Inject, args: [NGXS_PLUGINS,] }, { type: Optional },] },
]; };
//# sourceMappingURL=plugin-manager.js.map
