//
// Created by Dmitry Patsura on 2018-12-20.
//

#ifndef HLVM_RUNTIME_ARRAY_H
#define HLVM_RUNTIME_ARRAY_H

#include "library.h"
#include <cstdint>

template<typename T>
class Array {
    T* elements;
    int32_t size;
public:
    Array() : elements(nullptr), size(0) {}

    Array(int32_t size) {
        this->elements = new T[size];
        this->size = size;
    }

    void push(T value) {
        size++;
        elements[size] = value;
    }
};

#endif //HLVM_RUNTIME_ARRAY_H
