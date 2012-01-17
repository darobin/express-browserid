
var path = require("path")
,   https = require("https")
,   url = require("url")
,   qs = require("querystring")
;

exports.plugAll = function (app, opts) {
    this.plugHelperScript(app, opts);
    this.plugVerifier(app, opts);
    this.plugLogout(app, opts);
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
    app.post(route, function (req, res, next) {
        // this code "stolen" from the BrowserID project
        var reqParam = url.parse(opts.verifier || "https://browserid.org/verify");
        reqParam.method = "POST";
        var vreq = https.request(reqParam, function (vres) {
            var body = "";
            vres.on('data', function (chunk) { body += chunk; } )
                .on('end', function () {
                    try {
                        var verifierResp = JSON.parse(body)
                        ,   valid = verifierResp && verifierResp.status === "okay"
                        ,   email = valid ? verifierResp.email : null;
                        if (req.session) req.session.email = email;
                        // if (valid) console.log("assertion verified successfully for email:", email);
                        // else console.log("failed to verify assertion:", verifierResp.reason);
                        if (valid) res.json({ status: "okay", email: email });
                        else       res.json({ status: "error", reason: verifierResp.reason });
                    }
                    catch (e) {
                        res.json({ status: "error", reason: "Server-side exception." });
                    }
            });
        });
        vreq.setHeader("Content-Type", "application/x-www-form-urlencoded");
        var data = qs.stringify({
            assertion:  req.body.assertion
        ,   audience:   opts.audience || req.body.audience
        });
        vreq.setHeader("Content-Length", data.length);
        vreq.write(data);
        vreq.end();
    });
};

exports.plugLogout = function (app, opts) {
    opts = opts || {};
    var route = opts.logoutPath || makePath("/logout", opts);
    app.all(route, function (req, res) {
        if (req.session) req.session.email = null;
        res.json(true);
    });
};

function makePath (path, opts) {
    var base = opts.basePath || "/browserid";
    return base + path;
}
