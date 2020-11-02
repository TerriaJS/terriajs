# Prerender Troubleshooting
TerriaMap prerenders pages through puppeteer.
It should JustWork on MacOS. Linux will require some extra deps. Some more general troubleshooting at:
https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md

## WSL
You'll need to tell PrerenderSPAPlugin to pass an `executablePath` down to puppeteer.

via @steve9164's findings

Add (changing the path to where your chrome is)
`executablePath: '/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe'`

to

https://github.com/TerriaJS/TerriaMap/blob/c8675bc62cd5e37b6df490910f6ed7f7ae264d95/buildprocess/webpack.config.js#L155
