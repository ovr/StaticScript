cmake_minimum_required(VERSION 3.12)
project(runtime_test)

set(CMAKE_CXX_STANDARD 14)

#link_directories("/Users/ovr/projects/ovr/hlvm/runtime")
find_library(hlvm-runtime "/Users/ovr/projects/ovr/hlvm/runtime")



link_directories("/Users/ovr/projects/ovr/hlvm/runtime")
find_library(hlvm-runtime "/Users/ovr/projects/ovr/hlvm/runtime")

add_executable(main.cpp)

#
#link_libraries("/Users/ovr/projects/ovr/hlvm/runtime")


target_link_libraries(runtime_test hlvm-runtime)