import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
/**
 * BehaviorSubject of the entire state.
 * @ignore
 */
var StateStream = /** @class */ (function (_super) {
    tslib_1.__extends(StateStream, _super);
    function StateStream() {
        return _super.call(this, {}) || this;
    }
    return StateStream;
}(BehaviorSubject));
export { StateStream };
StateStream.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateStream.ctorParameters = function () { return []; };
//# sourceMappingURL=state-stream.js.map
