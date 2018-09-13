import { ensureStoreMetadata } from '../internal/internals';
/**
 * Decorates a method with a action information.
 */
export function Action(actions, options) {
    return function (target, name, descriptor) {
        const meta = ensureStoreMetadata(target.constructor);
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        for (const action of actions) {
            const type = action.type;
            if (!action.type) {
                throw new Error(`Action ${action.name} is missing a static "type" property`);
            }
            if (!meta.actions[type]) {
                meta.actions[type] = [];
            }
            meta.actions[type].push({
                fn: name,
                options: options || {},
                type
            });
        }
    };
}
//# sourceMappingURL=action.js.map
