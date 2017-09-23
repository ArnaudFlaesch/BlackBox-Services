/**
 * Created by Arnaud on 06/05/2017.
 */

const server = require("../src/server"),
    assert = require("assert"),
    request = require("supertest"),
    should = require("should"),
    user = require("../src/model/user");

describe("server", function () {
    before(function () {
        server.listen(port);
    });

    after(function () {
        server.close();
    });
});

describe("User tests", function () {
    it("should register an user", function (done) {
        request(server)
            .post("/user/register")
            .send({ email: "aflaesch@gmail.com", password: "root"})
            .expect(200)
            .end(function(err, res) {
                assert.equal(res.body.email, "aflaesch@gmail.com");
            });

        request(server)
            .post("/user/register")
            .send({ email: "aflaesch2@gmail.com", password: "root"})
            .expect(200)
            .end(function(err, res) {
                assert.equal(res.body.email, "aflaesch2@gmail.com");
                done();
            });
    });

    it("should fail to register because of same email", function (done) {
        request(server)
            .post("/user/register")
            .send({ email: "aflaesch@gmail.com", password: "root"})
            .expect(500)
            .expect({error: "L'email est déjà utilisé."}, done);
    });

    it("should log in an user", function (done) {
        request(server)
            .post("/user/login")
            .send({ email: "aflaesch@gmail.com", password: "root"})
            .expect(200)
            .end(function(err, res) {
                assert.equal(res.body.email, "aflaesch@gmail.com");
                done();
            });
    });

    it("should get the users list", function (done) {
        request(server)
            .get("/user/list")
            .expect(200)
            .end(function(err, res) {
                assert.equal(res.body.length, 2);
                done();
            });
    });

    it("should update the first user's data", function (done) {
        request(server)
            .get("/user/list")
            .expect(200)
            .end(function(err, res) {
                res.body[0].email = "arnaudflaesch@gmail.com";
                request(server)
                    .post("/user/update")
                    .send(res.body[0])
                    .expect(200)
                    .end(function(err, res) {
                        assert.equal(res.body.email, "arnaudflaesch@gmail.com");
                        done();
                    })
            });
    });

    it("should delete the second user", function (done) {
        request(server)
            .get("/user/list")
            .expect(200)
            .end(function(err, res) {
                request(server)
                    .delete("/user/delete?userId=" + res.body[1]._id + "&password=root")
                    .expect(200)
                    .end(function(err, res) {
                        assert.equal(res.body.message, "User successfully deleted.");
                        request(server)
                            .get("/user/list")
                            .expect(200)
                            .end(function(err, res) {
                                assert.equal(res.body.length, 1);
                                done();
                            });
                    })
            });
    });
});
