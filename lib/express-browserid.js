
var path = require("path");

exports.plugAll = function (app, opts) {
    this.plugHelperScript(app, opts);
};

exports.plugHelperScript = function (app, opts) {
    opts = opts || {};
    var route = opts.helperScriptPath || makePath("/js/browserid-helper.js", opts)
    ,   filepath = path.join(module.filename, "../public/js/browserid-helper.js");
    ;
    app.get(route, function (req, res, next) {
        res.sendfile(filepath);
    });
};

function makePath (path, opts) {
    var base = opts.basePath || "/browserid";
    return base + path;
}
