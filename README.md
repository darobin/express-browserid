
## Overview

This is a set of helper code that intends to make using [BrowserID](https://browserid.org/) easier
from inside an Express application. I slapped it together because as I started integrating BrowserID
support into one of my project, I realised that while there were great pieces of code as well as
documentation and examples, most of them using NodeJS already, a decent amount of assembly was
required in order to actually use it (either that, or I didn't find the right pieces ;). That's
not surprising: this is very new technology, and you don't expect it to come in a velvet-padded
case.

`express-browserid` tries to fill that gap. I cannot say that it has seen much production use at this
point since it has essentially been producing by me pasting the code I had used to explore
BrowserID into a module but it ought to be simple to use.

It works by adding its own set of routes to your Express `app` that can:

* verify that a browser assertion is valid and set the email in the session;
* logout (i.e. remove the email from the session);
* send a helper client-side script.

The client-side script knows how to trigger a BrowserID sign-in and contact the verify route
to check that the sign-in is valid. It is easily configurable, and emits events throughout its
lifecycle to enable UI code to react to the sign-in's progress.

## Usage (Server)

Somewhere as part of your routes (i.e. after configuration):

    require("express-browserid").plugAll(app);

This method supports options, and there are other methods that will plug individual routes on their
own rather than all of them at once. Details below.

## Usage (Client)

Include the following script anywhere after having included jQuery and 
https://browserid.org/include.js.

    &lt;script src="/browserid/js/browserid-helper.js" data-debug="true" data-csrf="deadbeef">&lt;/script>

The path to the script can be configured on the server side (or if you prefer, you can load it from your
own public directory — but you don't have to). All the data-* attributes that configure its behaviour are 
optional, and there are more than just the ones listed above (details below).

## Installation

    $ npm install express-browserid

## Interface (Server)

The NodeJS side of the code supports the following methods:

* plugAll(app, [opt]). Calls all of the methods below in turn in order to plug all the routes into the app.
  It takes an Express `app` object (required) and optionally a dictionary of options which are passed on to
  the following methods.
* plugHelperScript(app, [opt]). Creates the GET route for the helper script. That defaults to
  `/browserid/js/browserid-helper.js` unless overridden using the options described below.
* plugVerifier(app, [opt]). Creates the POST route for the sign-in verification operation. That defaults to
  `/browserid/verify` unless overridden using the options described below.
* plugLogout(app, [opt]). Creates the "all" route (it works for any HTTP method) that logs the user out by
  unsetting the `email` key in the session. Defaults to `/browserid/logout` unless overridden using the options
  described below.

The methods above accept the following options. `plugAll` accepts them all and passes them on, the others accept
the ones that make sense to them.

* basePath. The root path under which the other routes are set up. It defaults to `/browserid` (note the leading
 `/`). If you change it to `/foo` then logout becomes `/foo/logout`, the verifier `/foo/verify`, etc.
* helperScriptPath. The route for the client-side helper script. This overrides not just the default value, but
  also the value built using `basePath`. That is to say, if you set `basePath` to `/foo` and `helperScriptPath`
  to `/bar/browserid-helper.js` then the route will be `/bar/browserid-helper.js` and won't take `/foo` into 
  account. IMPORTANT NOTE: currently, this path has to end with `browserid-helper.js` otherwise the script won't
  be able to accept configuration correctly. This may change.
* verifierPath. The route to the verify operation. The same note applies for overriding as in `helperScriptPath`.
* logoutPath. The route to the logout operation. The same note applies for overriding as in `helperScriptPath`.
* verifier. The URL for the verification service to use, defaults to "https://browserid.org/verify" but you can
  use any service that follows the specification.
* audience. The scheme + host + optional port (e.g. `http://berjon.com` or `https://github.com:8001`) for which
  this authentication is being made. Only override this if you know what you're doing, the client side is a better
  place to configure this setting (if configured there, it will be used here).

## Interface (Client)

XXX
    attr:
        data-auto
        data-debug
        data-verifier
        data-selector
        data-csrf
        data-audience
    events (on window):
        login-attempt
        login-response
        received-assertion
        login-error
            no verify data
            verify error
            browserid error
        login-success

## License 

(The MIT License)

Copyright (c) 2012 Robin Berjon &lt;robin@berjon.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
