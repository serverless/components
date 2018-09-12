FROM ubuntu:latest

RUN apt-get update -y \
  && apt-get upgrade -y \
  && apt-get install -y screen rsync curl git gnupg2

# install Node.js and update npm
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get update -y \
  && apt-get upgrade -y \
  && apt-get install -y nodejs build-essential \
  && npm install npm@latest -g

# install Docker
RUN curl -fsSL get.docker.com -o get-docker.sh
RUN sh get-docker.sh
