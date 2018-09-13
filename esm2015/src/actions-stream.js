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
export class OrderedSubject extends Subject {
    constructor() {
        super(...arguments);
        this._itemQueue = [];
        this._busyPushingNext = false;
    }
    next(value) {
        if (this._busyPushingNext) {
            this._itemQueue.unshift(value);
            return;
        }
        this._busyPushingNext = true;
        super.next(value);
        while (this._itemQueue.length > 0) {
            const nextValue = this._itemQueue.pop();
            super.next(nextValue);
        }
        this._busyPushingNext = false;
    }
}
/**
 * Internal Action stream that is emitted anytime an action is dispatched.
 */
export class InternalActions extends OrderedSubject {
}
InternalActions.decorators = [
    { type: Injectable },
];
/**
 * Action stream that is emitted anytime an action is dispatched.
 *
 * You can listen to this in services to react without stores.
 */
export class Actions extends Observable {
    constructor(actions$, ngZone) {
        super(observer => {
            actions$
                .pipe(enterZone(ngZone))
                .subscribe(res => observer.next(res), err => observer.error(err), () => observer.complete());
        });
    }
}
Actions.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Actions.ctorParameters = () => [
    { type: InternalActions, },
    { type: NgZone, },
];
//# sourceMappingURL=actions-stream.js.map
