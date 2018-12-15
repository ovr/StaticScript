
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
