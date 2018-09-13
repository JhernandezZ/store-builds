import { SelectFromState } from '../internal/internals';
/**
 * Function for creating a selector
 * @param selectors The selectors to use to create the arguments of this function
 * @param originalFn The original function being made into a selector
 */
export declare function createSelector(selectors: any[], originalFn: any, creationMetadata?: {
    containerClass: any;
    selectorName: string;
}): (...args: any[]) => any;
/**
 * This function gets the selector function to be used to get the selected slice from the app state
 * @ignore
 */
export declare function getSelectorFn(selector: any): SelectFromState;
