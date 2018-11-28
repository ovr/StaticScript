#cmake_minimum_required(VERSION 3.7)
#
#project(v8-static)
#
#set(CMAKE_BUILD_TYPE Release)
#set(CMAKE_CXX_STANDARD 14)
#
#set(BASEPATH "${CMAKE_SOURCE_DIR}")
#include_directories("${BASEPATH}")
#
#set(SOURCE_FILES
#    src/base/platform/mutex.cc
#    src/base/platform/time.cc
#    src/base/platform/platform-macos.cc
#    src/base/once.cc
#    src/base/logging.cc
#    src/base/utils/random-number-generator.cc
#)
#
#add_library(v8-static STATIC ${SOURCE_FILES})
