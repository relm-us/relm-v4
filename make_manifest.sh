DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

( cd $DIR/public &&
  echo "const manifest = {" &&
  (ls -ls *.{png,jpg,glb} | awk '{print "  \"" $10 "\": " $6 ","}') &&
  echo "}" &&
  echo &&
  echo "export { manifest }" &&
  echo
) > $DIR/src/manifest.js
