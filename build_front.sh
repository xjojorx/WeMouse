#!/bin/bash
echo "build client"
cd ./client/solidclient
pnpm i
pnpm run build
cd ../..

echo "copy cliend result"
cp ./client/solidclient/dist/index.html ./static/index.html
cp ./client/solidclient/dist/assets/*.js ./static/index.js
cp ./client/solidclient/dist/assets/*.css ./static/index.css

sed -i'' -e 's/\/assets\/index-[^.]*\./\/index./g' ./static/index.html

echo "DONE"
