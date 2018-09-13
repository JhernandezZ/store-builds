import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';
/**
 * Operator to run the `subscribe` in a Angular zone.
 */
export declare function enterZone<T>(zone: NgZone): (source: Observable<T>) => Observable<T>;
