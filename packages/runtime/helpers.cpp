#include <cmath>
#include <stdio.h>

#include "helpers.h"

LIBRARY_EXPORT const char* number2string(double number) {
    char* result = new char[100];

    sprintf(result, "%f", number);

    return result;
}

LIBRARY_EXPORT void console_log(double number) {
    puts(number2string(number));
}

LIBRARY_EXPORT void console_log(const char *str) {
    puts(str);
}

LIBRARY_EXPORT void console_log(bool boolean) {
    if (boolean) {
        puts("true");
    } else {
        puts("false");
    }
}

LIBRARY_EXPORT double Math__floor(double number) {
    return std::floor(number);
}
