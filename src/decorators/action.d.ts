import { ActionOptions } from '../symbols';
/**
 * Decorates a method with a action information.
 */
export declare function Action(actions: any | any[], options?: ActionOptions): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
