import { OperatorFunction, Observable } from 'rxjs';
export declare function ofAction<T>(allowedType: any): OperatorFunction<any, T>;
export declare function ofAction<T>(...allowedTypes: any[]): OperatorFunction<any, T>;
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been dispatched
 */
export declare function ofActionDispatched(...allowedTypes: any[]): (o: Observable<any>) => Observable<any>;
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been successfully completed
 */
export declare function ofActionSuccessful(...allowedTypes: any[]): (o: Observable<any>) => Observable<any>;
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been canceled
 */
export declare function ofActionCanceled(...allowedTypes: any[]): (o: Observable<any>) => Observable<any>;
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just thrown an error
 */
export declare function ofActionErrored(...allowedTypes: any[]): (o: Observable<any>) => Observable<any>;
