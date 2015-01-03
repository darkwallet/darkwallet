Darkwallet [![Build Status](https://drone.io/github.com/darkwallet/darkwallet/status.png)](https://drone.io/github.com/darkwallet/darkwallet/latest) [![Code Quality](https://codeclimate.com/github/darkwallet/darkwallet.png)](https://codeclimate.com/github/darkwallet/darkwallet) [![Coverage Status](https://coveralls.io/repos/darkwallet/darkwallet/badge.png?branch=develop)](https://coveralls.io/r/darkwallet/darkwallet?branch=develop)
===========

We love Bitcoin, and the power it gives for trade and social connections. There is so much untapped power in Bitcoin. You know the saying "we only use 10% of our brain's power"? We probably use less than 1% of what is possible with Bitcoin!

We want to start with a simple premise: Bitcoin in your browser. We want a beautiful experience with privacy features built in by default.

This wallet will serve as a platform or a starting codebase to deliver a high quality Bitcoin that serves the people.

Running
-----------

You can load the extension into Chrome by going to _Extensions_, enabling _Development mode_ and clicking the _Load uncompressed extension_ button.


Alpha!!!
-----------
We're still in [alpha](http://en.wikipedia.org/wiki/Software_release_life_cycle#Alpha) state, that means we're still changing things a lot and it's not safe at all to use the wallet.
More information at: https://wiki.unsystem.net/index.php/DarkWallet/Alpha

You are *very welcome* to test, just remember the following:
 * Write down your seed and be always ready to use it to restore the identity.
 * First thing you should do is get familiar with creating and restoring an identity.
 * You can do: "create new identity", choose same name as before and restore, this will upgrade your store (you will still need to re add pockets and addresses, contacts etc...)
 * If you notice strange behavior after upgrading, you should:
    1. Restart the background process from darkwallet (from "manage extensions")
    2. If that doesn't work: Clear Darkwallet storage, (from darkwallet settings), restart chromium

We have been following this procedure since the wallet is under development without problems.

*Remember*: Your funds are safe as long as you *don't lose your seed* to restore later.

Other than that we're not making many guarantees.


Development
-----------
You are welcome to participate in the development by contributing or forking the code at:

<https://github.com/darkwallet/darkwallet>

More info about how to develop on the [HACKING.md](HACKING.md) document.

Other useful documents are: [HD Structure](https://wiki.unsystem.net/en/index.php/DarkWallet/HDWallet), [How to Help](https://wiki.unsystem.net/en/index.php/DarkWallet/HowToHelp) and [Debugging](https://wiki.unsystem.net/en/index.php/DarkWallet/Debug)


Translations
-----------
Changes to translations as well as new translations can be submitted to [Darkwallet's Transifex page](https://www.transifex.com/projects/p/darkwallet/).

Translations are periodically pulled from Transifex and merged into the git repository.

**Important**: We do not accept translation changes as GitHub pull requests because the next pull from Transifex would automatically overwrite them again.


Contact
-----------

Use the following resources for communication with "the team"

* [Mailing list](https://lists.unsystem.net/cgi-bin/mailman/listinfo/darkwallet)
* IRC: #darkwallet (freenode)
* [Forum](https://forum.unsystem.net/category/projects/darkwallet)
* [Wiki](https://wiki.unsystem.net/en/index.php/Darkwallet)


License
------------
See the license [here](COPYRIGHT)

Support Us!
------------

Support our development efforts by donating to the darkwallet multisig:

 31oSGBBNrpCiENH3XMZpiP6GTC4tad4bMy

--

> I went to the store the other day to buy a bolt for our front door, for as I told the storekeeper, the governor was coming here. "Aye," said he, "and the Legislature too." "Then I will take two bolts," said I. He said that there had been a steady demand for bolts and locks of late, for our protectors were coming.
>
> -- <cite>Henry David Thoreau</cite>

- - -

Darkwallet Team
