#!/bin/sh
export PORT=3000
export USER=aaaaa
export PASS=bbbbb
export HAPROXY_URL="http://140.86.10.111:1936/haproxy?stats"
nodemon server.js
