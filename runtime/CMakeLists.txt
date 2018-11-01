cmake_minimum_required(VERSION 3.12)

project(hlvm-runtime)

set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_STANDARD 14)
set(SOURCE_FILES helpers.cpp)

#add_executable(runtime main.cpp)

add_library(hlvm-runtime STATIC ${SOURCE_FILES})
