# Prerender Troubleshooting
TerriaMap prerenders pages through puppeteer.
It should JustWork on MacOS. Linux will require some extra deps. Some more general troubleshooting at:
https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md

## Debugging with Remote Debugging or headless: false

Try adding a remote debugging port to the `Renderer` arguments and inspect instances of chromium as they are spawned in chrome:inspect (in Google Chrome) or edge:inspect (in Edge).

```js
renderer: new Renderer({
  args: ["--remote-debugging-port=9222"]
  ...
})
```

Otherwise you can try turning on `headless: false` to launch Chrome in a window to see rendering. You will probably have to increase the timeout from 5000 to at least 20000.

## WSL
> You'll need to tell PrerenderSPAPlugin to pass an `executablePath` down to puppeteer.
> 
> via @steve9164's findings
> 
> Add (changing the path to where your chrome is)
> `executablePath: '/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe'`
> 
> to
> 
> https://github.com/TerriaJS/TerriaMap/blob/c8675bc62cd5e37b6df490910f6ed7f7ae264d95/buildprocess/webpack.config.js#L155

The above may work, or may only be suitable advice for WSL 1. In WSL 2 you should be able to follow the UNIX (Ubuntu) instructions for Chrome headless and install relevant packages. An X server application such as MobaXTerm along with `export DISPLAY="$(/sbin/ip route | awk '/default/ { print $3 }'):0"` should allow running in `headless: false` mode for debugging.
