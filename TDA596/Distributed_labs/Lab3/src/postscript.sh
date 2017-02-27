#!/bin/bash

send() {
  curl -d "entry=t$1" -X 'POST' "http://$2/entries" &>/dev/null
  printf "."
}

IPS=('129.32.84.160:63114' '139.80.206.133:63114' '128.223.8.113:63114')
BATCHES=2
IBATCH=0
BATCH_SIZE=10
ISENT=0
INODE=0
while [ $IBATCH -lt $BATCHES ]; do
  printf "Batch $IBATCH:"
  ILOOP=0
  while [ $ILOOP -lt $BATCH_SIZE ]; do
    send $ISENT ${IPS[INODE]} &
    ((ILOOP++))
    ((ISENT++))
    ((INODE++))
    INODE=$(expr $INODE % ${#IPS[*]})
  done
  wait
  printf "\n"
  ((IBATCH++))
done
wait
printf "\n"
echo -n "Press enter when the board has reached consistency"
read user

INODE=0
for i in `seq 1 20`; do
  rnd=$((RANDOM % 5))
  if [ $rnd -lt 2 ]; then
    printf "ADD "
    send $i ${IPS[INODE]} &
  else
    if [ $rnd -lt 4 ] ; then
      printf "MOD "
      post="entry=m$i&id=$i&delete=0"
    elif [ $rnd -eq 4 ]; then
      printf "DEL "
      post="entry=d$i&id=$i&delete=1"
    fi
    curl -d "$post" -X 'POST' "http://${IPS[INODE]}/entries" 2>/dev/null 1>&2 &
  fi
((INODE++))
INODE=$(expr $INODE % ${#IPS[*]})
done

printf "\n"
echo "Waiting for requests to finish..."
wait
printf "\n"
echo "Done"
