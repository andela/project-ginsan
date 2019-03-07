/**
 * Module dependencies.
 */
var should = require('should'),
    app = require('../../server'),
    mongoose = require('mongoose'),
    User = mongoose.model('User');

//Globals
var user;

//The tests
describe('User Tests', function () {
    describe('Model User:', function () {
        before(function (done) {
            user = new User({
                name: 'Full name',
                email: 'test@test.com',
                username: 'user',
                password: 'password'
            });

            done();
        });

        describe('Method Save', function () {
            it('should be able to save without problems', function (done) {
                return user.save(function (err) {
                    should.not.exist(err);
                    done();
                });
            }).timeout(50000);

            it('should be able to show an error when try to save without name', function (done) {
                user.name = '';
                return user.save(function (err) {
                    should.exist(err);
                    done();
                });
            });
        });

        after(async function (done) {
          let result = await   User.deleteMany({email: "test@test.com"});
            done();
        });
    });
});