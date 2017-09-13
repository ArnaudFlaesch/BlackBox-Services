const server = require("../src/server"),
    assert = require('assert'),
    exec = require("child_process").exec,
    request = require("supertest"),
    User = require("../src/model/user");

describe("server", function () {
    before(function () {
        server.listen(port);
    });

    after(function () {
        server.close();
    });
});

describe("Server status and Message", function () {
    it("status response should be equal 200", function (done) {
        User.remove({}, function(err) {
            console.log("Collection removed");
            exec("shx rm -rf " + "./blackbox");
            exec("shx mkdir " + "./blackbox");
        });

        request(server)
            .get('/')
            .expect(200)
            .end(function(err, res) {
                assert.equal(res.body.message, "Welcome to BlackBox's Services !");
                done();
            });
    });
});
