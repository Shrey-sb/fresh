//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
app.use(express.static("public"));
app.set('view engine', 'ejs');


app.use(session({
  secret: "our litte secret.",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  }

);
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  }

);

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/hospital4you",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

const hpitalSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  state : String,
  Address : String,
  Contact : Number,
  General_Physicians : Number,
 Pediatricians : Number,
 General_Surgeon : Number,
 Cardiologist : Number,
 Dentist : Number,
 Dermatologists : Number,
 Gynecologist : Number,
 ENT_Specialist : Number

});
const Hpital = new mongoose.model("Hpital", hpitalSchema);

const temp1_hpital = new Hpital({
  name: "aiims1",
  rating: 4,
  highest_score: 5,
  state : "delhi"
});
temp1_hpital.save();
const temp2_hpital = new Hpital({
  name: "aiims2",
  rating: 5,
  highest_score: 35,
  state : "delhi"
});
temp2_hpital.save();
const temp3_hpital = new Hpital({
  name: "aiims3",
  rating: 2,
  highest_score:4,
  state : "delhi"
});
temp3_hpital.save();
var allhospital = [temp1_hpital,temp2_hpital,temp3_hpital];

app.use(bodyParser.urlencoded({
  extended: true
}));

app.post("/search",function(req,res){
res.render("search_page",{detailsofthehospital :allhospital});
});


app.get("/", function(req, res) {
  res.render("home");
});
app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/secrets", function(req, res) {
  User.find({"secret":{$ne:null}},function(err, foundusers){
    if(err){
      console.log(err);
    }else{
      if(foundusers){
        res.render("secrets",{usersWithSecrets : foundusers});
      }
    }
  })

});
app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedsecret = req.body.secret;
  User.findById(req.user.id ,function(err, founduser){
    if(err){
      console.log(err);
    }else{
      if(founduser){
        founduser.secret =submittedsecret;
        founduser.save(function(){
          res.redirect("/secrets");
        })
      }
    }
  })
})


app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
})
app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });
app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  })
});
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });


});
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port");
});
