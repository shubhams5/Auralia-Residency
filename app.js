//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://admin-shubham:suman@20@cluster0.lzrwf.mongodb.net/Auralia-ResidencyDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
});

const User = new mongoose.model("User", userSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

adminSchema.plugin(passportLocalMongoose);
adminSchema.plugin(findOrCreate);

const Admin = new mongoose.model("Admin", adminSchema);

passport.use(Admin.createStrategy());

passport.serializeUser(function (admin, done) {
  done(null, admin.id);
});

passport.deserializeUser(function (id, done) {
  Admin.findById(id, function (err, admin) {
    done(err, admin);
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/admin", function (req, res) {
  res.render("adminLogin");
});

app.get("/adminDashboard", function (req, res) {
  res.render("tables");
});

app.post("/login", function (req, res) {
  const admin = new Admin({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(admin, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/tables");
      });
    }
  });
});

app.post("/register", function (req, res) {
  Admin.register(
    {
      username: req.body.username,
    },
    req.body.password,
    function (err, admin) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});

app.post("/submit", function (req, res) {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    message: req.body.message,
  });

  user.save(function (err, doc) {
    if (err) return console.error(err);
    console.log("Document inserted successfully!");
  });

  res.redirect("/");
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/tables", function (req, res) {
  if (req.isAuthenticated()) {
    User.find({}, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("tables", {
            tableUserData: foundUsers,
          });
        }
      }
    });
  } else {
    res.redirect("/admin");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
  console.log("Server started on port 3000");
}
app.listen(port);
