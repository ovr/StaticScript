#include <cmath>

#include "math.h"
#include "v8/src/base/utils/random-number-generator.cc"

LIBRARY_EXPORT double Math__pow(double number, double power) {
    return std::pow(number, power);
}

LIBRARY_EXPORT double Math__sqrt(double number) {
    return std::sqrt(number);
}

LIBRARY_EXPORT double Math__floor(double number) {
    return std::floor(number);
}

LIBRARY_EXPORT double Math__round(double number) {
    return std::round(number);
}

LIBRARY_EXPORT double Math__random() {
    v8::base::RandomNumberGenerator rand(92834738);

    return rand.NextDouble();
}
