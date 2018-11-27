FROM node:10-stretch

RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - && \
    echo "deb http://apt.llvm.org/stretch/ llvm-toolchain-stretch-7 main" | tee -a /etc/apt/sources.list && \
    apt update -qq &&  \
    apt install libz-dev cmake clang git llvm-7 llvm-7-dev -y && \
    ln -s /usr/bin/llvm-config-7 /usr/bin/llvm-config
