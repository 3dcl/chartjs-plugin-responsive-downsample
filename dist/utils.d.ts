/**
 * Check if a value is null or undefined
 */
export declare function isNil(value: any): value is null | undefined;
/**
 * Clamp a number to a range
 * @param value
 * @param min
 * @param max
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Recursivly assign default values to an object if object is missing the keys.
 * @param object The destination object to assign default values to
 * @param defaults The default values for the object
 * @return The destination object
 */
export declare function defaultsDeep<T>(object: T, defaults: Partial<T>): T;
/**
 * Finds the first element in an array for that the comaperator functions returns true
 *
 * @export
 * @template T Element type of the array
 * @param {Array<T>} array An array
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {T} The found element or undefined
 */
export declare function findInArray<T>(array: Array<T>, compareFunction: (element: T) => boolean): T;
/**
 * Finds the first index in an array for that the comaperator function for an element returns true
 *
 * @export
 * @template T
 * @param {Array<T>} array An array of elements
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {number} Index of the matched element or -1 if no element was found
 */
export declare function findIndexInArray<T>(array: Array<T>, compareFunction: (element: T) => boolean): number;
