
declare type int8 = {};
declare type int16 = {};
declare type int32 = {};
declare type int64 = {};
declare type int128 = {};

declare type uint8 = {};
declare type uint16 = {};
declare type uint32 = {};
declare type uint64 = {};
declare type uint128 = {};

declare type float32 = {};
declare type float64 = number;
declare type float128 = {};

interface Boolean {}

interface Function {}

interface IArguments {}

interface Number {}

interface Object {}

interface RegExp {}

interface String {}

interface Array<T = any> {}

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

declare function puts(str: string): void;

