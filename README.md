
## Overview

This is a set of helper code that intends to make using [BrowserID](https://login.persona.org/) easier
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

Note that the library uses POST, so Express must be configured prior to initialization with a body
parser:

    app.use(express.bodyParser());

## Usage (Client)

Include the following script anywhere after having included jQuery and
https://login.persona.org/include.js.

    <script src="/browserid/js/browserid-helper.js" data-debug="true" data-csrf="deadbeef"></script>

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
* sessionKey. The name of the key used to store the email in the session. Defaults to `email`.

## Interface (Client)

The client-side helper script can work out of the box with no configuration whatsoever, assuming you adhere to some
basic conventions: change none of the server-side routes, and use `#browserid-login` as the ID of the element on
which users click to initiate login.

If you need specific behaviour, you'll have to using the configuration attributes. These are placed on the script
element itself, and comprise:

* data-auto. By default, once the login is successful, the page is simply reloaded. The assumption there is that your
  server-side code will want to regenerate the page based on the newly established user identity. But that's not always
  the case, for instance you may have written a web application in which the client always gets the same code, but needs
  to authenticate to access specific APIs. In that case you can disable the reload behaviour by setting `data-auto`
  to `false`.
* data-debug. Set this to `true` to get extra information dumped to the `console`.
* data-verifier. The URL of the verifier service you want to use. Note that this is probably on your server unless you
  are confident you can work with cross-domain requests.
* data-selector. A jQuery selector that picks the element(s) on which the user can click to activate the BrowserID
  sign-in process. Defaults to `#browserid-login`.
* data-csrf. If your server has CSRF protection enabled (which it should) then set your CSRF token here. The simplest
  way is to use [the `express-csrf-plug` module](https://github.com/darobin/express-csrf) (shameless plug) for this
  as it will both enable CSRF and make a `csrf` variable available in your views which you can assign to this attribute.
* data-audience. The BrowserID audience you wish to authenticate for. This will default to a guess made based on the
  current page's location (which I think should generally be correct — but don't just take my word for it, try it!).

As the script progresses through the various phases of the sign-in, it dispatches events on the `window` object. You can
listen to them using `$(window).on("event-name", function (...) { ... })`. You don't have to listen to any of these,
but it is recommended that you listen for `login-error`. The reason for this is that the default behaviour for errors is
to do nothing, which isn't entirely user-friendly. If you've set `data-auto` to `false`, you probably want to listen for
`login-success` as well since you'll likely want to do something at that moment. The other events are mostly either for
debugging, or for displaying progress to the user if you so desire.

All events receive an event object as their first parameter, as always with jQuery. When additional parameters 
are discussed below, they are passed *after* that event object.

The following events are dispatched:

* login-attempt. The user has clicked on the piece of UI that starts the sign-in process. The BrowserID dialog
  should be showing up about now.
* login-response. The BrowserID service has replied. This does not indicate that the reply was successful. If
  we received an assertion back from the service, it is passed to the handler.
* received-assertion. The `login-response` above was indeed successful and an assertion was received. It is passed
  to the handler.
* login-error. There was an error at some stage. The handler gets a string indicating the error type, and a 
  if applicable additional data that was received and which can be used for debugging purposes. The possible error
  types are: `no verify data` indicates that the verification service failed so that the assertion was probably
  invalid (or something is seriously amiss); `verify error` indicates that there was a verification error, in
  which case the reason is given in the `reason` attribute of the additional data parameter; `browserid error`
  means that there was a problem contacting the BrowserID service (e.g. you're offline).
* login-success. The login was successful. The handler receives an additional data object that at least has
  an `email` attribute featuring the login email.

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
