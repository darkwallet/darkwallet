Darkwallet Development
==========

You are welcome to participate in the development by contributing or forking the code at:

https://github.com/darkwallet/darkwallet

For normal wallet development you can just modify the .js files, no need for fancy compilers :).

Note the wallet has a long running background process, so after modifying files (specially for
backend/ and model/ files) you may need to restart the background page.

The background process ties up the wallet behaviour for any number of open tabs.

Debugging
-----------
Check the following wiki page for information on getting to the debug consoles of the darkwallet:

 https://wiki.unsystem.net/index.php/DarkWallet/Debug

Code organization
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

Frontend development
-----------
From the frontend, You use the Darkwallet global object to access main objects for the
application.

The "main" files for the frontend are the js/frontend/controllers/ files, wallet.js is the
top level controller at the moment.

Backend development
-----------
The "main" file for the backend is js/backend/main.js.

The backend hosts several services (js/backend/services/) taking care of different aspects
of the application.

Frontend and backend communication
-----------

The frontend and backend processes use "Ports" for communication. The backend opens several service
ports, where the frontend areas can connect. This ensures callbacks are properly disconnected when
tabs are closed or controllers are destroyed, so we just get notifications from the backend on these
ports.

To command the backend, the frontend can access directly in most situations, so just start on Darkwallet
and move down.

Internationalization
--------------------

You can make a string translatable using the "_" filter:

```html
<p>{{'This string is translated to the system language'|_}}<p>
```

You can use **strong** and *emphasis* markdown formatting syntax:

```html
<p ng-bind-html="('I love *darkwallet*'|_)"></p>
```

Javascript errors are also translatable, separing the parameters using | inside the same string.

```js
throw new Error('Test error with some colors: {0}, {1} and {2}|'+['red', 'green', 'blue'].join('|'));
```

When you add or modify a language string, run the following command:

```sh
$ npm run i18n-update
```

Having transifex client downloaded and [configured](http://docs.transifex.com/developer/client/setup#configuration), you can:

```sh
$ tx push -s # Push the sources
$ tx pull -t # Pull the translations
```

Testing
-----------

We use the tool `karma` to run the tests.

All the following commands should be done from the darkwallet root folder.

### Setup your environment

```sh
$ npm -d install
$ npm install -g karma-cli # you may need sudo here
```

### Running the tests

```sh
$ karma start test/karma.conf.js
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

Javascript tasks
-----------

To update or modify dependencies you may need the following information:

### Adding/Upgrading dependencies with bower
If you want to add/upgrade a dependency, use bower.

```bash
$ bower install angular --save # --save option modify bower.json file
```

Read [bower documentation](http://bower.io) for more info.


CSS Hacking
-----------

Our css is generated from the files in the *sass* folder, so any changes should be done there instead of in the *css* folder.

### Setup your SASS compiling environment:

Make sure you have nodejs installed, then on the darkwallet root folder, do:

```sh
$ npm install -g grunt-cli bower # you may need sudo here
$ npm install
$ bower update

```

Then build with *grunt build* or just run *grunt* and it will keep watching for changes on the sass folder.

Icon set
-----------

You can use the following cheatsheet to look for icon codes:

 - http://fortawesome.github.io/Font-Awesome/cheatsheet/

Search other icon sets for useful icons:

 - http://icomoon.io

--

 - unsystem dev
