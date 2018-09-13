import { Observable } from 'rxjs';
/**
 * Operator to run the `subscribe` in a Angular zone.
 */
export function enterZone(zone) {
    return (source) => {
        return new Observable((sink) => {
            return source.subscribe({
                next(x) {
                    zone.run(() => sink.next(x));
                },
                error(e) {
                    zone.run(() => sink.error(e));
                },
                complete() {
                    zone.run(() => sink.complete());
                }
            });
        });
    };
}
//# sourceMappingURL=zone.js.map
