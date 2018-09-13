import * as tslib_1 from "tslib";
import { ensureStoreMetadata } from '../internal/internals';
/**
 * Decorates a method with a action information.
 */
export function Action(actions, options) {
    return function (target, name, descriptor) {
        var meta = ensureStoreMetadata(target.constructor);
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        try {
            for (var actions_1 = tslib_1.__values(actions), actions_1_1 = actions_1.next(); !actions_1_1.done; actions_1_1 = actions_1.next()) {
                var action = actions_1_1.value;
                var type = action.type;
                if (!action.type) {
                    throw new Error("Action " + action.name + " is missing a static \"type\" property");
                }
                if (!meta.actions[type]) {
                    meta.actions[type] = [];
                }
                meta.actions[type].push({
                    fn: name,
                    options: options || {},
                    type: type
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _a;
    };
}
//# sourceMappingURL=action.js.map
