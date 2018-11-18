cmake_minimum_required(VERSION 3.12)

project(hlvm-runtime)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_STANDARD 14)
set(SOURCE_FILES helpers.cpp helpers.h helpers.h jsvalue.h math.cpp math.h)

add_library(hlvm-runtime STATIC ${SOURCE_FILES})
