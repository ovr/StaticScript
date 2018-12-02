cmake_minimum_required(VERSION 3.12)
project(runtime_test)

set(CMAKE_CXX_STANDARD 14)

link_directories("../packages/runtime")
find_library(hlvm-runtime "../packages/runtime")

add_executable(runtime_test main.cpp)

target_link_libraries(runtime_test hlvm-runtime)