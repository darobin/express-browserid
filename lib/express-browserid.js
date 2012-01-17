
var path = require("path")
,   Shred = require("shred")
,   surf = new Shred
;

exports.plugAll = function (app, opts) {
    this.plugHelperScript(app, opts);
    this.plugVerifier(app, opts);
};

exports.plugHelperScript = function (app, opts) {
    opts = opts || {};
    var route = opts.helperScriptPath || makePath("/js/browserid-helper.js", opts)
    ,   filepath = path.join(module.filename, "../../public/js/browserid-helper.js");
    ;
    // XXX we should include strong caching headers here, and 304s for IMS
    app.get(route, function (req, res, next) {
        res.sendfile(filepath);
    });
};

exports.plugVerifier = function (app, opts) {
    opts = opts || {};
    var route = opts.verifierPath || makePath("/verify", opts);
    console.log("setting up route: " + route);
    app.post(route, function (req, res, next) {
        console.log("contacting verifier");
        surf.post({
            url:        opts.verifier || "https://browserid.org/verify"
        ,   headers:    {
                accept: "application/json"
            }
        ,   content:    {
                audience:   opts.audience || req.body.audience
            ,   assertion:  req.body.assertion
            }
        ,   on: {
                200:    function (data) {
                    console.log("verifier replied:", data);
                    if (data && "okay" === data.status) {
                        if (opts.verifyCB) opts.verifyCB(null, data);
                    }
                    else {
                        if (opts.verifyCB) opts.verifyCB(new Error("BrowserID verification failed"), data);
                    }
                    res.json(data);
                }
            ,   response:   function () {
                    res.send("BrowserID verification failed", 500);
                }
            }
        });
        console.log("verifier request sent");
    });
    console.log("route okay");
};

function makePath (path, opts) {
    var base = opts.basePath || "/browserid";
    return base + path;
}
