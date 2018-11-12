
#ifndef HLVM_RUNTIME_HELPERS_H
#define HLVM_RUNTIME_HELPERS_H

#define LIBRARY_EXPORT __attribute__ ((visibility ("default")))

LIBRARY_EXPORT const char* number2string(double number);

LIBRARY_EXPORT void console_log(double number);
LIBRARY_EXPORT void console_log(const char *str);
LIBRARY_EXPORT void console_log(bool boolean);

#endif //HLVM_RUNTIME_HELPERS_H
