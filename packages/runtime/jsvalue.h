//
// Created by Dmitry Patsura on 2018-11-08.
//

#ifndef HLVM_RUNTIME_JSVALUE_H
#define HLVM_RUNTIME_JSVALUE_H

class JSObject {
};

union JSValueHolder {
    double *number;
    bool *boolean;
    char *string;
    JSObject *object;
};

enum JSValueType {
    NUMBER = 0,
    NULL = 2,
    UNDEFINED = 3,
    OBJECT = 4,
    BOOLEAN = 5,
    SYMBOL = 6,
};

class JSValue {
protected:
    JSValueHolder *value;
    JSValueType *type;
public:
    bool isUndefined() const {
        return *this->type == UNDEFINED;
    }
};

#endif //HLVM_RUNTIME_JSVALUE_H
