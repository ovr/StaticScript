
/// <reference no-default-lib="true"/>

declare function number2string(value: number): string;

declare function console_log(value: number): void;
declare function console_log(value: string): void;
declare function console_log(value: boolean): void;

// https://www.ecma-international.org/ecma-262/6.0/#sec-math-object
declare class Math {
    /**
     * Returns the greatest integer less than or equal to its numeric argument.
     */
    static floor(value: number): number;
    static round(value: number): number;
    static sqrt(value: number): number;
    static pow(value: number, power: number): number;
    static random(): number;
    static abs(value: number): number;
}

interface Array<T = any> {
    // push(member: number): number;
}

declare type Int8Array = Array<int8>;
declare type Uint8Array = Array<uint8>;

interface Int8ArrayConstructor {
    new(length: number): Int8Array;
}

interface Uint8ArrayConstructor {
    new(length: number): Uint8Array;
}

declare const Int8Array: Int8ArrayConstructor;
declare const Uint8Array: Uint8ArrayConstructor;

declare type Int16Array = Array<int16>;
declare type Uint16Array = Array<uint16>;

interface Int16ArrayConstructor {
    new(length: number): Int16Array;
}

interface Uint16ArrayConstructor {
    new(length: number): Uint16Array;
}

declare const Int16Array: Int16ArrayConstructor;
declare const Uint16Array: Uint16ArrayConstructor;

declare type Int32Array = Array<int32>;
declare type Uint32Array = Array<uint32>;

interface Int32ArrayConstructor {
    new(length: number): Int32Array;
}

interface Uint32ArrayConstructor {
    new(length: number): Uint32Array;
}

declare const Int32Array: Int32ArrayConstructor;
declare const Uint32Array: Uint32ArrayConstructor;

declare type Float32Array = Array<float32>;
declare type Float64Array = Array<float64>;

interface Float32ArrayConstructor {
    new(length: number): Float32Array;
}

interface Float64ArrayConstructor {
    new(length: number): Float64Array;
}

declare const Float32Array: Float32ArrayConstructor;
declare const Float64Array: Float64ArrayConstructor;
