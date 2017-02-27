#!/bin/sh
for i in `seq 1 20`; do
  curl -X 'POST' 'http://127.0.0.1:63100/vote/attack'
done
