import { Store } from '../store';
/**
 * Allows the select decorator to get access to the DI store.
 * @ignore
 */
export declare class SelectFactory {
    static store: Store | undefined;
    constructor(store: Store);
}
/**
 * Decorator for selecting a slice of state from the store.
 */
export declare function Select(selectorOrFeature?: any, ...paths: string[]): (target: any, name: string) => void;
