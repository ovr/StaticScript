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
