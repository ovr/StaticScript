//
// Created by Dmitry Patsura on 2018-11-28.
//

#ifndef HLVM_RUNTIME_MACHINE_H
#define HLVM_RUNTIME_MACHINE_H

#include "v8/src/base/utils/random-number-generator.h"

/**
 * Store whole Runtime
 */
class Machine {
protected:
    v8::base::RandomNumberGenerator* randomNumberGenerator = nullptr;
public:
    static Machine& Instance() {
        static Machine s;

        return s;
    }

    v8::base::RandomNumberGenerator* getRandomNumberGenerator() {
        if (this->randomNumberGenerator) {
            return this->randomNumberGenerator;
        }

        return this->randomNumberGenerator = new v8::base::RandomNumberGenerator();
    }
private:
    Machine() { }
    ~Machine() { }

    Machine(Machine const&) = delete;
    Machine& operator= (Machine const&) = delete;
};


#endif //HLVM_RUNTIME_MACHINE_H
