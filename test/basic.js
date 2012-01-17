var foo = require("../");
describe("Foo", function () {
    describe("foo", function () {
        it("should do something", function () {
            foo.doSomething().should.equal("something");
        });
    });
});