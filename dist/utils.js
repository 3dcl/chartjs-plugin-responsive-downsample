"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Check if a value is null or undefined
 */
function isNil(value) {
    return (typeof value === "undefined") || value === null;
}
exports.isNil = isNil;
/**
 * Clamp a number to a range
 * @param value
 * @param min
 * @param max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
exports.clamp = clamp;
/**
 * Recursivly assign default values to an object if object is missing the keys.
 * @param object The destination object to assign default values to
 * @param defaults The default values for the object
 * @return The destination object
 */
function defaultsDeep(object, defaults) {
    for (var key in defaults) {
        var value = object[key];
        if (typeof value === "undefined") {
            object[key] = defaults[key];
        }
        else if (value !== null && typeof value === "object") {
            object[key] = defaultsDeep(value, defaults[key]);
        }
    }
    return object;
}
exports.defaultsDeep = defaultsDeep;
/**
 * Finds the first element in an array for that the comaperator functions returns true
 *
 * @export
 * @template T Element type of the array
 * @param {Array<T>} array An array
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {T} The found element or undefined
 */
function findInArray(array, compareFunction) {
    if (isNil(array))
        return undefined;
    for (var i = 0; i < array.length; i++) {
        if (compareFunction(array[i]) === true) {
            return array[i];
        }
    }
    return undefined;
}
exports.findInArray = findInArray;
/**
 * Finds the first index in an array for that the comaperator function for an element returns true
 *
 * @export
 * @template T
 * @param {Array<T>} array An array of elements
 * @param {(element: T) => boolean} compareFunction Comperator function returning true for the element seeked
 * @returns {number} Index of the matched element or -1 if no element was found
 */
function findIndexInArray(array, compareFunction) {
    if (isNil(array))
        return undefined;
    for (var i = 0; i < array.length; i++) {
        if (compareFunction(array[i]) === true) {
            return i;
        }
    }
    return -1;
}
exports.findIndexInArray = findIndexInArray;
