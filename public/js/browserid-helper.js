
(function ($) {
    "use strict";

    var options = {
        auto:       true
    ,   verifier:   "/browserid/verify"
    ,   selector:   "#browserid-login"
    };
    $("script").each(function () {
        var $scr = $(this);
        if (/js\/browserid-helper\.js(?:\?.+)?$/.test($scr.attr("src"))) {
            if ("false" === $scr.attr("data-auto")) options.auto = false;
            options.verifier = $scr.attr("data-verifier") || options.verifier;
            options.selector = $scr.attr("data-selector") || options.selector;
            return false;
        }
    });
    $(options.selector).click(function () {
        
    });
    
    window.BrowserIDHelper = {
        // listen to clicks on a given selector
        // on click call the browserid site
        // on success, call the verify URL (defaults to this lib's default)
        //      if that works, trigger success cb, or go to redir URL, or reload
        // on error
        //      trigger error cb, or alert error
    };
})(jQuery);
