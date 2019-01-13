//
// Created by Dmitry Patsura on 2019-01-03.
//

#ifndef HLVM_RUNTIME_DYNAMIC_H
#define HLVM_RUNTIME_DYNAMIC_H

#include <cstdint>

enum DynamicType: int8_t {
    BOOLEAN = 1,
    NUMBER = 2,
    INT64 = 3,
    UNDEFINED = 3,
};

class Dynamic {
public:
    Dynamic(double value) {
        this->number = value;
        this->type = DynamicType::NUMBER;
    }

    Dynamic(bool value) {
        this->boolean = value;
        this->type = DynamicType::BOOLEAN;
    }

    Dynamic(int64_t value) {
        this->int64 = value;
        this->type = DynamicType::INT64;
    }

    Dynamic() {
        this->type = DynamicType::UNDEFINED;
    }
private:
    DynamicType type;

    union {
        double number;
        bool boolean;
        int64_t int64;
    };
};

#endif //HLVM_RUNTIME_DYNAMIC_H
