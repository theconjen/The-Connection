#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ios_dir="$script_dir"

# Known duplicate artifacts that can confuse Xcode/Expo when present.
duplicates=(
  "${ios_dir}/TheConnection 2.xcodeproj"
  "${ios_dir}/TheConnection 2.xcworkspace"
  "${ios_dir}/Podfile 2"
  "${ios_dir}/Podfile 2.lock"
  "${ios_dir}/Podfile.lock 2"
  "${ios_dir}/Podfile 2.lock.json"
  "${ios_dir}/Podfile.lock 2.json"
  "${ios_dir}/Pods 2"
)

removed_any=false
for path in "${duplicates[@]}"; do
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "Removed duplicate: $path"
    removed_any=true
  fi
done

if [ "$removed_any" = false ]; then
  echo "No duplicate Xcode/Pod artifacts found under $ios_dir."
fi
