#!/usr/bin/env bash

for i in {1..100}; do
    cat lipsum.txt > "fixtures/files/test_$i.txt"
done
