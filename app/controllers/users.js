/**
 * Module dependencies.
 */
const jwt = require('jsonwebtoken')
var mongoose = require('mongoose')

var User = mongoose.model('User')
var avatars = require('./avatars').all()

/**
 * Auth callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/chooseavatars')
}

/**
 * Show login form
 */
exports.signin = function (req, res) {
  if (!req.user) {
    res.redirect('/#!/signin?error=invalid')
  } else {
    res.redirect('/#!/app')
  }
}

/**
 * Show sign up form
 */
exports.signup = function (req, res) {
  if (!req.user) {
    res.redirect('/#!/signup')
  } else {
    res.redirect('/#!/app')
  }
}

/**
 * Logout
 */
exports.signout = function (req, res) {
  req.logout()
  res.redirect('/')
}

/**
 * Session
 */
exports.session = function (req, res) {
  res.redirect('/')
}

/**
 * Check avatar - Confirm if the user who logged in via passport
 * already has an avatar. If they don't have one, redirect them
 * to our Choose an Avatar page.
 */
exports.checkAvatar = function (req, res) {
  if (req.user && req.user._id) {
    User.findOne({
      _id: req.user._id
    })
      .exec(function (err, user) {
        if (user.avatar !== undefined) {
          res.redirect('/#!/')
        } else {
          res.redirect('/#!/choose-avatar')
        }
      })
  } else {
    // If user doesn't even exist, redirect to /
    res.redirect('/')
  }
}

/**
 * Create user
 */
exports.create = async function (req, res) {
  if (req.body.name && req.body.password && req.body.email) {
    User.findOne({
      email: req.body.email
    }).exec(function (err, existingUser) {
      if (err) {
        console.error(err)
      }
      if (!existingUser) {
        var user = new User(req.body)
        // Switch the user's avatar index to an actual avatar url
        user.avatar = avatars[user.avatar]
        user.provider = 'local'
        user.save(async function (err) {
          if (err) {
            return res.status(400)
              .json({
                'userCreated': false,
                'errorMessage': err
              })
          } else {
            let sharedKey = 'thePennyDropped'
            let token = await jwt.sign({ data: 'kibana' }, sharedKey, { expiresIn: 160 })
            return res.status(201).json({
              'userCreated': true,
              token
            })
          }
        })
      } else {
        return res.status(400).json({
          'userCreated': false,
          'errorMessage': 'User already exist'
        })
      }
    })
  } else {
    return res.status(400)
      .json({
        'userCreated': false,
        'errorMessage': 'Missing fields'
      })
  }
}

/**
 * Assign avatar to user
 */
exports.avatars = function (req, res) {
  // Update the current user's profile to include the avatar choice they've made
  if (req.user && req.user._id && req.body.avatar !== undefined &&
    /\d/.test(req.body.avatar) && avatars[req.body.avatar]) {
    User.findOne({
      _id: req.user._id
    })
      .exec(function (err, user) {
        user.avatar = avatars[req.body.avatar]
        user.save()
      })
  }
  return res.redirect('/#!/app')
}

exports.addDonation = function (req, res) {
  if (req.body && req.user && req.user._id) {
    // Verify that the object contains crowdrise data
    if (req.body.amount && req.body.crowdrise_donation_id && req.body.donor_name) {
      User.findOne({
        _id: req.user._id
      })
        .exec(function (err, user) {
        // Confirm that this object hasn't already been entered
          if (err) {
            console.error(err)
          }
          var duplicate = false
          for (var i = 0; i < user.donations.length; i++) {
            if (user.donations[i].crowdrise_donation_id === req.body.crowdrise_donation_id) {
              duplicate = true
            }
          }
          if (!duplicate) {
            console.log('Validated donation')
            user.donations.push(req.body)
            user.premium = 1
            user.save()
          }
        })
    }
  }
  res.send()
}

/**
 *  Show profile
 */
exports.show = function (req, res) {
  var user = req.profile

  res.render('users/show', {
    title: user.name,
    user: user
  })
}

/**
 * Send User
 */
exports.me = function (req, res) {
  res.jsonp(req.user || null)
}

/**
 * Find user by id
 */
exports.user = function (req, res, next, id) {
  User
    .findOne({
      _id: id
    })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    })
}
