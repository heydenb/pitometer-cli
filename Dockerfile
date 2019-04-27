FROM node:10-alpine
RUN apk update && apk upgrade && \
    apk add --no-cache bash git jq
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install -g
COPY . .
CMD ["/bin/bash"]
