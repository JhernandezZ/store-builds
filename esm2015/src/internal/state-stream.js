import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
/**
 * BehaviorSubject of the entire state.
 * @ignore
 */
export class StateStream extends BehaviorSubject {
    constructor() {
        super({});
    }
}
StateStream.decorators = [
    { type: Injectable },
];
/** @nocollapse */
StateStream.ctorParameters = () => [];
//# sourceMappingURL=state-stream.js.map
