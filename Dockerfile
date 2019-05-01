FROM node:10-alpine
RUN apk update && apk upgrade && \
    apk add --no-cache git
WORKDIR /usr/src/app
RUN npm install -g pkg pkg-fetch
COPY package*.json ./
RUN npm install
COPY . .
RUN pkg -t node10-alpine-x64 -o /usr/src/app/pitometer-cli .
FROM alpine:3.9
RUN apk update && apk upgrade && \
    apk add --no-cache bash git jq libgcc libstdc++
COPY --from=0 /usr/src/app/pitometer-cli /usr/local/bin/pitometer-cli
CMD ["/bin/bash"]
