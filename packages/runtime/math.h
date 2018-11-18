//
// Created by Dmitry Patsura on 2018-11-18.
//

#include "library.h"

#ifndef HLVM_RUNTIME_MATH_H
#define HLVM_RUNTIME_MATH_H

LIBRARY_EXPORT double Math__pow(double number, double power);
LIBRARY_EXPORT double Math__sqrt(double number);
LIBRARY_EXPORT double Math__floor(double number);
LIBRARY_EXPORT double Math__round(double number);
LIBRARY_EXPORT double Math__random();

#endif //HLVM_RUNTIME_MATH_H
