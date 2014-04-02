Dark Wallet Development
==========

You are welcome to participate in the development by contributing or forking the code at:

https://github.com/darkwallet/darkwallet

For normal wallet development you can just modify the .js files, no need for fancy compilers :).

Note the wallet has a long running background process, so after modifying files (specially for 
backend/ and model/ files) you may need to restart the background page.

The code is structured as follows:

js/              Code Root
js/backend       Background page specific code (runs on the background)
js/frontend      User facing code (runs on the tabs, tied to html, uses angular)
js/model         Storage related core, and generic model functionality.
js/util          Generic utils

The background process ties up the wallet behaviour for any number of open tabs.

Frontend development:
-----------
From the frontend, You use the DarkWallet global object to access main objects for the
application.

The "main" files for the frontend are the js/frontend/controllers/ files, wallet.js is the
top level controller at the moment.

Backend development:
-----------
The "main" file for the backend is js/backend/main.js.

The backend hosts several services (js/backend/services/) taking care of different aspects
of the application.

Frontend and backend communication:
-----------

The frontend and backend processes use "Ports" for communication. The backend opens several service
ports, where the frontend areas can connect. This ensures callbacks are properly disconnected when
tabs are closed or controllers are destroyed, so we just get notifications from the backend on these
ports.

To command the backend, the frontend can access directly in most situations, so just start on DarkWallet
and move down.

Javascript tasks:
-----------

To update or modify dependencies you may need the following information:

### Adding/Upgrading dependencies with bower
If you want to add/upgrade a dependency, use bower.

```bash
$ bower install angular --save # --save option modify bower.json file
```

Read [bower documentation](http://bower.io) for more info.


CSS Hacking:
-----------

To modify the CSS we use sass, so you need to mofify the sass files, then run
the tasks below to generate the css the app needs.


### Grunt tasks

* `grunt` - watching (Sass, Server on 127.0.0.1:9000 with LiveReload)
* `grunt build` - Sass
* `grunt validate-js` - JSHint
* `grunt publish` - dist directory
* `grunt server-dist` - server on 127.0.0.1:9001 - dist directory (preview only)

Icon set:
-----------

You can use the following cheatsheet to look for icon codes: 

 - http://fortawesome.github.io/Font-Awesome/cheatsheet/

--

 - unsystem dev
