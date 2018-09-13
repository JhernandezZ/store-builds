/**
 * Decorator for memoizing a state selector.
 */
export declare function Selector(selectors?: any[]): (target: any, key: string, descriptor: PropertyDescriptor) => {
    configurable: boolean;
    get(): (...args: any[]) => any;
};
