FROM node:10-slim

RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - && \
    echo "deb http://apt.llvm.org/stretch/ llvm-toolchain-stretch-6.0 main" | tee -a /etc/apt/sources.list && \
    apt update -qq &&  \
    apt install libz-dev cmake clang git llvm-6.0 llvm-6.0-dev -y && \
    ln -s /usr/bin/llvm-config-6.0 /usr/bin/llvm-config
