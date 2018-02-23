FROM ubuntu:latest

RUN apt-get update -y \
  && apt-get upgrade -y \
  && apt-get install -y screen rsync curl git

# install Node.js and update npm
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update -y \
  && apt-get upgrade -y \
  && apt-get install -y nodejs build-essential \
  && npm install npm@latest -g
