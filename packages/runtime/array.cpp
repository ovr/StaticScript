//
// Created by Dmitry Patsura on 2018-12-20.
//

#include "array.h"

LIBRARY_EXPORT Array<int8_t>* Int8ArrayConstructor__constructor(double size) {
    return new Array<int8_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<uint8_t>* Uint8ArrayConstructor__constructor(double size) {
    return new Array<uint8_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<int16_t>* Int16ArrayConstructor__constructor(double size) {
    return new Array<int16_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<uint16_t>* Uint16ArrayConstructor__constructor(double size) {
    return new Array<uint16_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<int32_t>* Int32ArrayConstructor__constructor(double size) {
    return new Array<int32_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<uint32_t>* Uint32ArrayConstructor__constructor(double size) {
    return new Array<uint32_t>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<float>* Float32ArrayConstructor__constructor(double size) {
    return new Array<float>(static_cast<int32_t>(size));
}

LIBRARY_EXPORT Array<double>* Float64ArrayConstructor__constructor(double size) {
    return new Array<double>(static_cast<int32_t>(size));
}
