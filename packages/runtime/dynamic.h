//
// Created by Dmitry Patsura on 2019-01-03.
//

#ifndef HLVM_RUNTIME_DYNAMIC_H
#define HLVM_RUNTIME_DYNAMIC_H

#include <cstdint>

enum DynamicType: int8_t {
    BOOLEAN_TYPE = 1,
    DOUBLE_TYPE = 2,
};

class Dynamic {
public:
    Dynamic(double value) {
        this->d = value;
        this->type = DynamicType::DOUBLE_TYPE;
    }

    Dynamic(bool value) {
        this->b = value;
        this->type = DynamicType::BOOLEAN_TYPE;
    }

    void setValue(double value) {
        this->d = value;
        this->type = DynamicType::DOUBLE_TYPE;
    };

    void setValue(bool value) {
        this->b = value;
        this->type = DynamicType::BOOLEAN_TYPE;
    };
private:
    DynamicType type;

    union {
        double d;
        bool b;
    };
};

#endif //HLVM_RUNTIME_DYNAMIC_H
