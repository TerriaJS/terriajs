#!/usr/bin/env bash
DOCREPO=$1
rm -rf wwwroot/doc 
mkdir wwwroot/doc 
cp doc/index-built.html wwwroot/doc/index.html 
cp doc/CNAME wwwroot/doc/CNAME 
gulp docs 
cd wwwroot/doc 
git init 
git remote add origin ${DOCREPO}
git add . 
git commit -m 'Generate Documentation' 
exit 0
git push -f origin HEAD:gh-pages
