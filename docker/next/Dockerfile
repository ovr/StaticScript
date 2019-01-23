FROM registry.gitlab.com/ovr/staticscript:node-11-llvm-8

WORKDIR /usr/share/static-script

RUN git clone https://github.com/ovr/StaticScript.git /usr/share/static-script && \
    npm install && \
    npm run build && \
    npm install packages/runtime && \
    ln -s /usr/share/static-script/bin/ssc /usr/bin/ssc
