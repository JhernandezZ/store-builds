import { Observable } from 'rxjs';
/**
 * Operator to run the `subscribe` in a Angular zone.
 */
export function enterZone(zone) {
    return function (source) {
        return new Observable(function (sink) {
            return source.subscribe({
                next: function (x) {
                    zone.run(function () { return sink.next(x); });
                },
                error: function (e) {
                    zone.run(function () { return sink.error(e); });
                },
                complete: function () {
                    zone.run(function () { return sink.complete(); });
                }
            });
        });
    };
}
//# sourceMappingURL=zone.js.map
