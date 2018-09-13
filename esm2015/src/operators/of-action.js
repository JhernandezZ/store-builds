import { map, filter } from 'rxjs/operators';
import { getActionTypeFromInstance } from '../utils/utils';
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will grab actions that have just been dispatched as well as actions that have completed
 */
export function ofAction(...allowedTypes) {
    return ofActionOperator(allowedTypes);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been dispatched
 */
export function ofActionDispatched(...allowedTypes) {
    return ofActionOperator(allowedTypes, "DISPATCHED" /* Dispatched */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been successfully completed
 */
export function ofActionSuccessful(...allowedTypes) {
    return ofActionOperator(allowedTypes, "SUCCESSFUL" /* Successful */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been canceled
 */
export function ofActionCanceled(...allowedTypes) {
    return ofActionOperator(allowedTypes, "CANCELED" /* Canceled */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just thrown an error
 */
export function ofActionErrored(...allowedTypes) {
    return ofActionOperator(allowedTypes, "ERRORED" /* Errored */);
}
function ofActionOperator(allowedTypes, status) {
    const allowedMap = createAllowedMap(allowedTypes);
    return function (o) {
        return o.pipe(filterStatus(allowedMap, status), mapAction());
    };
}
function filterStatus(allowedTypes, status) {
    return filter((ctx) => {
        const actionType = getActionTypeFromInstance(ctx.action);
        const type = allowedTypes[actionType];
        return status ? type && ctx.status === status : type;
    });
}
function mapAction() {
    return map((ctx) => ctx.action);
}
function createAllowedMap(types) {
    return types.reduce((acc, klass) => {
        acc[getActionTypeFromInstance(klass)] = true;
        return acc;
    }, {});
}
//# sourceMappingURL=of-action.js.map
