import * as tslib_1 from "tslib";
import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { enterZone } from './operators/zone';
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
    tslib_1.__extends(OrderedSubject, _super);
    function OrderedSubject() {
        var _this = _super.apply(this, tslib_1.__spread(arguments)) || this;
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
export { OrderedSubject };
/**
 * Internal Action stream that is emitted anytime an action is dispatched.
 */
var InternalActions = /** @class */ (function (_super) {
    tslib_1.__extends(InternalActions, _super);
    function InternalActions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InternalActions;
}(OrderedSubject));
export { InternalActions };
InternalActions.decorators = [
    { type: Injectable },
];
/**
 * Action stream that is emitted anytime an action is dispatched.
 *
 * You can listen to this in services to react without stores.
 */
var Actions = /** @class */ (function (_super) {
    tslib_1.__extends(Actions, _super);
    function Actions(actions$, ngZone) {
        return _super.call(this, function (observer) {
            actions$
                .pipe(enterZone(ngZone))
                .subscribe(function (res) { return observer.next(res); }, function (err) { return observer.error(err); }, function () { return observer.complete(); });
        }) || this;
    }
    return Actions;
}(Observable));
export { Actions };
Actions.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Actions.ctorParameters = function () { return [
    { type: InternalActions, },
    { type: NgZone, },
]; };
//# sourceMappingURL=actions-stream.js.map
