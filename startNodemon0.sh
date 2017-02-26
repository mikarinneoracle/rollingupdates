#!/bin/sh
export PORT=3000
export USER=aaaaa
export PASS=bbbbb
#export MONGODB=140.86.1.34:27017
#export MONGODB_USER=console
#export MONGODB_PASS=console1
export MONGODB=localhost:27017
export MONGODB_USER=console
export MONGODB_PASS=console1
nodemon server.js
