import { map, filter } from 'rxjs/operators';
import { getActionTypeFromInstance } from '../utils/utils';
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will grab actions that have just been dispatched as well as actions that have completed
 */
export function ofAction() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been dispatched
 */
export function ofActionDispatched() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "DISPATCHED" /* Dispatched */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been successfully completed
 */
export function ofActionSuccessful() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "SUCCESSFUL" /* Successful */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just been canceled
 */
export function ofActionCanceled() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "CANCELED" /* Canceled */);
}
/**
 * RxJS operator for selecting out specific actions.
 *
 * This will ONLY grab actions that have just thrown an error
 */
export function ofActionErrored() {
    var allowedTypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedTypes[_i] = arguments[_i];
    }
    return ofActionOperator(allowedTypes, "ERRORED" /* Errored */);
}
function ofActionOperator(allowedTypes, status) {
    var allowedMap = createAllowedMap(allowedTypes);
    return function (o) {
        return o.pipe(filterStatus(allowedMap, status), mapAction());
    };
}
function filterStatus(allowedTypes, status) {
    return filter(function (ctx) {
        var actionType = getActionTypeFromInstance(ctx.action);
        var type = allowedTypes[actionType];
        return status ? type && ctx.status === status : type;
    });
}
function mapAction() {
    return map(function (ctx) { return ctx.action; });
}
function createAllowedMap(types) {
    return types.reduce(function (acc, klass) {
        acc[getActionTypeFromInstance(klass)] = true;
        return acc;
    }, {});
}
//# sourceMappingURL=of-action.js.map
