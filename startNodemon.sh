#!/bin/sh
export PORT=3000
export USER=mika
export PASS=mika999
export HAPROXY_URL=http://140.86.10.3:1936/haproxy?stats
export ADMIN_HOST=https://140.86.10.183
export BEARER=9c8b751dae821b0ff2f7f95ebd55dc13740dbac2936b9e4c2d8638814d51b8ff
nodemon server.js
