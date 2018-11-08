#include <string>
#include <sstream>
#include <iostream>

#include "helpers.h"

__attribute__ ((visibility ("default"))) const char* number2string(double number) {
    char* result = new char[100];

    sprintf(result, "%f", number);

    return result;
}
