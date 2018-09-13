import { META_KEY, SELECTOR_META_KEY } from '../symbols';
/**
 * Ensures metadata is attached to the class and returns it.
 *
 * @ignore
 */
export function ensureStoreMetadata(target) {
    if (!target.hasOwnProperty(META_KEY)) {
        var defaultMetadata = {
            name: null,
            actions: {},
            defaults: {},
            path: null,
            children: [],
            instance: null
        };
        Object.defineProperty(target, META_KEY, { value: defaultMetadata });
    }
    return getStoreMetadata(target);
}
/**
 * Get the metadata attached to the class if it exists.
 *
 * @ignore
 */
export function getStoreMetadata(target) {
    return target[META_KEY];
}
/**
 * Ensures metadata is attached to the selector and returns it.
 *
 * @ignore
 */
export function ensureSelectorMetadata(target) {
    if (!target.hasOwnProperty(SELECTOR_META_KEY)) {
        var defaultMetadata = {
            selectFromAppState: null,
            originalFn: null,
            containerClass: null,
            selectorName: null
        };
        Object.defineProperty(target, SELECTOR_META_KEY, { value: defaultMetadata });
    }
    return getSelectorMetadata(target);
}
/**
 * Get the metadata attached to the selector if it exists.
 *
 * @ignore
 */
export function getSelectorMetadata(target) {
    return target[SELECTOR_META_KEY];
}
/**
 * The generated function is faster than:
 * - pluck (Observable operator)
 * - memoize
 *
 * @ignore
 */
export function fastPropGetter(paths) {
    var segments = paths;
    var seg = 'store.' + segments[0];
    var i = 0;
    var l = segments.length;
    var expr = seg;
    while (++i < l) {
        expr = expr + ' && ' + (seg = seg + '.' + segments[i]);
    }
    var fn = new Function('store', 'return ' + expr + ';');
    return fn;
}
/**
 * Given an array of states, it will return a object graph. Example:
 *    const states = [
 *      Cart,
 *      CartSaved,
 *      CartSavedItems
 *    ]
 *
 * would return:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * @ignore
 */
export function buildGraph(stateClasses) {
    var findName = function (stateClass) {
        var meta = stateClasses.find(function (g) { return g === stateClass; });
        if (!meta) {
            throw new Error("Child state not found: " + stateClass);
        }
        if (!meta[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        return meta[META_KEY].name;
    };
    return stateClasses.reduce(function (result, stateClass) {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        var _a = stateClass[META_KEY], name = _a.name, children = _a.children;
        result[name] = (children || []).map(findName);
        return result;
    }, {});
}
/**
 * Given a states array, returns object graph
 * returning the name and state metadata. Example:
 *
 *  const graph = {
 *    cart: { metadata }
 *  };
 *
 * @ignore
 */
export function nameToState(states) {
    return states.reduce(function (result, stateClass) {
        if (!stateClass[META_KEY]) {
            throw new Error('States must be decorated with @State() decorator');
        }
        var meta = stateClass[META_KEY];
        result[meta.name] = stateClass;
        return result;
    }, {});
}
/**
 * Given a object relationship graph will return the full path
 * for the child items. Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const r = {
 *    cart: 'cart',
 *    saved: 'cart.saved',
 *    items: 'cart.saved.items'
 *  };
 *
 * @ignore
 */
export function findFullParentPath(obj, newObj) {
    if (newObj === void 0) { newObj = {}; }
    var visit = function (child, keyToFind) {
        for (var key in child) {
            if (child.hasOwnProperty(key) && child[key].indexOf(keyToFind) >= 0) {
                var parent_1 = visit(child, key);
                return parent_1 !== null ? parent_1 + "." + key : key;
            }
        }
        return null;
    };
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var parent_2 = visit(obj, key);
            newObj[key] = parent_2 ? parent_2 + "." + key : key;
        }
    }
    return newObj;
}
/**
 * Given a object graph, it will return the items topologically sorted Example:
 *
 *  const graph = {
 *    cart: ['saved'],
 *    saved: ['items'],
 *    items: []
 *  };
 *
 * would return:
 *
 *  const results = [
 *    'items',
 *    'saved',
 *    'cart'
 *  ];
 *
 * @ignore
 */
export function topologicalSort(graph) {
    var sorted = [];
    var visited = {};
    var visit = function (name, ancestors) {
        if (ancestors === void 0) { ancestors = []; }
        if (!Array.isArray(ancestors)) {
            ancestors = [];
        }
        ancestors.push(name);
        visited[name] = true;
        graph[name].forEach(function (dep) {
            if (ancestors.indexOf(dep) >= 0) {
                throw new Error("Circular dependency '" + dep + "' is required by '" + name + "': " + ancestors.join(' -> '));
            }
            if (visited[dep]) {
                return;
            }
            visit(dep, ancestors.slice(0));
        });
        if (sorted.indexOf(name) < 0) {
            sorted.push(name);
        }
    };
    Object.keys(graph).forEach(function (k) { return visit(k); });
    return sorted.reverse();
}
/**
 * Returns if the parameter is a object or not.
 *
 * @ignore
 */
export function isObject(obj) {
    return (typeof obj === 'object' && obj !== null) || typeof obj === 'function';
}
//# sourceMappingURL=internals.js.map
