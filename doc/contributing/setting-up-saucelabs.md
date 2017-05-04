- Get an account from [https://saucelabs.com/open-source](https://saucelabs.com/open-source).
- DON'T bother installing any tunnels or any of that nonsense that it tells you to do. This is actually automatically handled by sauce's npm module which is pretty sweet.
- Go to "My Account" in saucelabs (bottom left menu) and copy your access key (middle of the page roughly).
- Set env variables for SAUCE_USERNAME and SAUCE_ACCESS_KEY using your OS's method for doing that (`export` in bash) with your sauce username and the access key you just copied.
- Run `npm install -g karma-cli` Without this karma will sort-of work but give you confusing errors.
- Run `npm start` in your `terriajs` dir in another terminal.
- Run `gulp test-saucelabs` if you have a `karma-saucelabs.conf.js` file, or run `karma start` from the TerriaJS directory if you have a `karma.config.js` file.

If you want to narrow down the browsers being run (i.e. only run IE9), you can remove them from `karma[-saucelabs].config.js` under `browsers`.