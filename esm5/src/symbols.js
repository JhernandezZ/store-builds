import { InjectionToken } from '@angular/core';
export var ROOT_STATE_TOKEN = new InjectionToken('ROOT_STATE_TOKEN');
export var FEATURE_STATE_TOKEN = new InjectionToken('FEATURE_STATE_TOKEN');
export var META_KEY = 'NGXS_META';
export var SELECTOR_META_KEY = 'NGXS_SELECTOR_META';
export var NGXS_PLUGINS = new InjectionToken('NGXS_PLUGINS');
/**
 * The NGXS config settings.
 */
var NgxsConfig = /** @class */ (function () {
    function NgxsConfig() {
    }
    return NgxsConfig;
}());
export { NgxsConfig };
//# sourceMappingURL=symbols.js.map
