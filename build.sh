#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

set -x

# echo "Writing src/manifest.js..."
# $DIR/make_manifest.sh

echo "Cleaning public/build/ folder & re-building..."
rm -rf $DIR/public/build && yarn build
RESULT=$?

if [ $RESULT -eq 0 ]; then
  # If `brotli` exists, use it to compress textual assets
  hash twiggy 2>/dev/null &&
    brotli public/build/*.{js,js.map}
  
  echo "Build succeeded"
  exit 0
else
  echo "Build failed"
  exit 1
fi