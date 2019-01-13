//
// Created by Dmitry Patsura on 2018-12-20.
//

#ifndef HLVM_RUNTIME_ARRAY_H
#define HLVM_RUNTIME_ARRAY_H

#include "library.h"
#include <cstdint>
#include <cstdlib>

template<typename T>
class Array {
public: 
    Array() : elements(nullptr), capacity(0) {}

    Array(int32_t capacity) {
        this->capacity = capacity;
        this->elements = new T[capacity];
    }

    void push(T value) {
        if (size == capacity) {
            this->expand();
        }

        this->size++;
        this->elements[size] = value;
    }

private:
    T* elements;
    int32_t size = 0;
    int32_t capacity;

    void expand() {
        this->size *= 2;
        this->elements = std::realloc(this->elements, this->size * sizeof(T));
    }
};

#endif //HLVM_RUNTIME_ARRAY_H
