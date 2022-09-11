const express = require('express')
router = express.Router()
passport = require('passport')
const mongoose = require('mongoose')
User = mongoose.model('User');

router.get('/', (req, res) =>  {
  res.render('home');
});

router.get('/register', (req, res) =>  {
  res.render('register');
});

router.post('/register', (req, res) =>  {
  const {username, password} = req.body;
  User.register(new User({username}), req.body.password, (err, user) => {
    if (err) {
      res.render('error',{message:'Your registration information is not valid'});
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/');
      });
    }
  });   
});

router.get('/login', (req, res) =>  {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => { //on success this sets req.user?
    if(user) {
      req.logIn(user, (err) => {
        res.redirect('/user/add');
      });
    } else {
      res.render('error', {message:'Your login or password is incorrect.'});
    }
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;