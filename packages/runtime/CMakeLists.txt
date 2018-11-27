cmake_minimum_required(VERSION 3.7)

project(hlvm-runtime)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_STANDARD 14)
set(SOURCE_FILES
    helpers.cpp
    helpers.h
    helpers.h
    jsvalue.h
    math.cpp
    math.h
    v8/src/base/utils/random-number-generator.cc
    v8/src/base/utils/random-number-generator.h
)

add_library(hlvm-runtime STATIC ${SOURCE_FILES})
