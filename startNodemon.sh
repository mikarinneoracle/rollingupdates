#!/bin/sh
export PORT=3000
export HA_USER="occsdemo"
export HA_PASS="occspass"
export HAPROXY_URL="http://140.86.10.3:1936/haproxy?stats"
nodemon server.js
