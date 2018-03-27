
/**
 * Check if a value is null or undefined
 */
export function isNil(value: any): value is null | undefined {
    return (typeof value === "undefined") || value === null;
}

/**
 * Clamp a number to a range
 * @param value
 * @param min
 * @param max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Recursivly assign default values to an object if object is missing the keys.
 * @param object The destination object to assign default values to
 * @param defaults The default values for the object
 * @return The destination object 
 */
export function defaultsDeep<T>(object: T, defaults: Partial<T>): T {
    for (let key in defaults) {
        const value = object[key];

        if (typeof value === "undefined") {
            object[key] = defaults[key];
        } else if (value !== null && typeof value === "object") {
            object[key] = defaultsDeep(value, defaults[key]);
        }
    }

    return object;
}
