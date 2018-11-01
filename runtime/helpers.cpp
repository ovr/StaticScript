#include <string>
#include <sstream>
#include <iostream>

__attribute__ ((visibility ("default"))) const char* number2string(double number) {
    std::stringstream s;

    s << number;

    return s.str().c_str();
}
