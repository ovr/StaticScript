cmake_minimum_required(VERSION 3.7)

project(hlvm-runtime)

include_directories("v8")

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_STANDARD 14)
set(SOURCE_FILES
    helpers.cpp
    helpers.h
    helpers.h
    jsvalue.h
    math.cpp
    math.h
    v8/src/base/platform/mutex.cc
    v8/src/base/platform/time.cc
    v8/src/base/platform/semaphore.cc
    v8/src/base/platform/platform-posix.cc
    v8/src/base/platform/platform-posix-time.cc
    v8/src/base/platform/platform-macos.cc
    v8/src/base/bits.cc
    v8/src/base/once.cc
    v8/src/base/logging.cc
    v8/src/base/utils/random-number-generator.cc
)

add_library(hlvm-runtime STATIC ${SOURCE_FILES})
