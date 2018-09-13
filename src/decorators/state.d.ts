import { StoreOptions } from '../symbols';
/**
 * Error message
 * @ignore
 */
export declare const stateNameErrorMessage: (name: any) => string;
/**
 * Decorates a class with ngxs state information.
 */
export declare function State<T>(options: StoreOptions<T>): (target: any) => void;
