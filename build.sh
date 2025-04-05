#!/bin/bash
./build_front.sh

echo "cargo build"
cargo build --release

echo "DONE"
