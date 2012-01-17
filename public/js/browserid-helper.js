
(function ($) {
    "use strict";

    var options = {
        auto:       true
    ,   debug:      false
    ,   verifier:   "/browserid/verify"
    ,   selector:   "#browserid-login"
    };
    function audience () {
        var scheme = location.protocol
        ,   audience = scheme + "//" + location.hostname
        ;
        if ("http:" === scheme && "80" != location.port) audience += ":" + location.port;
        else if ("https:" === scheme && "443" != location.port) audience += ":" + location.port;
        return audience;
    }
    $("script").each(function () {
        $scr = $(this);
        if (/js\/browserid-helper\.js(?:\?.+)?$/.test($scr.attr("src"))) {
            if ("false" === $scr.attr("data-auto")) options.auto = false;
            if ("true" === $scr.attr("data-debug")) options.debug = true;
            options.verifier = $scr.attr("data-verifier") || options.verifier;
            options.selector = $scr.attr("data-selector") || options.selector;
            options.audience = $scr.attr("data-audience") || audience();
            return false;
        }
    });
    var $win = $(window);
    $(options.selector).click(function () {
        $win.trigger("login-attempt");
        navigator.id.get(function (assertion) {
            $win.trigger("login-response", assertion);
            if (assertion) {
                $win.trigger("received-assertion", assertion);
                $.post(
                        options.verifier
                    ,   { audience: options.audience, assertion: assertion }
                    ,   function (data) {
                            if (!data) $win.trigger("login-error", "no verify data");
                            if ("okay" === data.status) {
                                $win.trigger("login-success", data);
                            }
                            else {
                                $win.trigger("login-error", ["verify error", data]);
                            }
                        }
                ), "json";
            }
            else {
                $win.trigger("login-error", "browserid error");
            }
        });
    });
    if (options.debug) {
        $win.on("login-attempt", function () {
            console.log("[BrowserID] attempting to log in");
        });
        $win.on("login-response", function (ev, ass) {
            console.log("[BrowserID] login responded with assertion: " + (ass ? ass : "*none*"));
        });
        $win.on("received-assertion", function (ev, ass) {
            console.log("[BrowserID] assertion received: " + ass);
        });
        $win.on("login-error", function (ev, type, data) {
            console.log("[BrowserID] error: " + type, data);
        });
        $win.on("login-success", function (ev, data) {
            console.log("[BrowserID] success!", data);
        });
    }
    if (options.auto) {
        $win.on("login-success", function (ev, data) {
            location.reload();
        });
    }
})(jQuery);
