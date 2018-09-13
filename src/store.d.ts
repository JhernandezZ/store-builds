import { NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { InternalStateOperations } from './internal/state-operations';
import { StateStream } from './internal/state-stream';
export declare class Store {
    private _ngZone;
    private _stateStream;
    private _internalStateOperations;
    constructor(_ngZone: NgZone, _stateStream: StateStream, _internalStateOperations: InternalStateOperations);
    /**
     * Dispatches event(s).
     */
    dispatch(event: any | any[]): Observable<any>;
    /**
     * Selects a slice of data from the store.
     */
    select<T>(selector: (state: any, ...states: any[]) => T): Observable<T>;
    select(selector: string | any): Observable<any>;
    /**
     * Select one slice of data from the store.
     */
    selectOnce<T>(selector: (state: any, ...states: any[]) => T): Observable<T>;
    selectOnce(selector: string | any): Observable<any>;
    /**
     * Select a snapshot from the state.
     */
    selectSnapshot<T>(selector: (state: any, ...states: any[]) => T): T;
    selectSnapshot(selector: string | any): any;
    /**
     * Allow the user to subscribe to the root of the state
     */
    subscribe(fn?: any): Subscription;
    /**
     * Return the raw value of the state.
     */
    snapshot(): any;
    /**
     * Reset the state to a specific point in time. This method is useful
     * for plugin's who need to modify the state directly or unit testing.
     */
    reset(state: any): any;
}
