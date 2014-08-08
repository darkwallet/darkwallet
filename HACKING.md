Darkwallet Development
==========

You are welcome to participate in the development by contributing or forking the code at:

https://github.com/darkwallet/darkwallet

For normal wallet development you can just modify the .js files, no need for fancy compilers :).

Note the wallet has a long running background process, so after modifying files (specially for 
backend/ and model/ files) you may need to restart the background page.

The background process ties up the wallet behaviour for any number of open tabs.

Debugging:
-----------
Check the following wiki page for information on getting to the debug consoles of the darkwallet:

 https://wiki.unsystem.net/index.php/DarkWallet/Debug

Code organization:
-----------

The code is structured as follows:

<pre>
js/			Code Root
├── backend		Background page specific code (runs on the background)
│   ├── channels	Communication channels and transport
│   └── services	Backend services
├── frontend		User facing code (runs on the tabs, tied to html, uses angular)
│   ├── controllers	Angular controllers
│   ├── directives	Angular directives
│   ├── filters		Angular filters
│   ├── popup		Code for the popup area on the topbar
│   └── scripts		Content scripts
├── model		Storage related core, and generic model functionality.
└── util		Generic utils
    └── ng		Angular utils
</pre>

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

Testing
-------

Unit tests can be run using `karma`.

```sh
$ npm -d install
$ karma start
```

Releasing
---------

We use [semver](http://semver.org) to version our releases, you can read
the specification in their web.

We also use [git flow](http://nvie.com/posts/a-successful-git-branching-model/)
branching model, so you can assume that the code in the master branch is stable
and the bleeding edge is in the develop branch.

We use git flow util in order to realize it. It can be downloaded using apt:

```sh
$ sudo apt-get install git-flow
```

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

Search other icon sets for useful icons:

 - http://icomoon.io

--

 - unsystem dev
