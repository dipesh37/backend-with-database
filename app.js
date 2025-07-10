const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const postModel = require("./models/post");

const app = express();
const userModel = require("./models/user");

require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.get("/profile", isLoggedIn, (req, res) => {
  console.log(req.user); //we get user data in our terminal
  res.render("login");
});

app.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;

  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        age,
        name,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh"); //signing
      res.cookie("token", token);
      res.send("User is successfully registered!");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("Something Went Wrong"); //it tells that no user is there with that particular email in database

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh"); //setting token in login part
      res.cookie("token", token);
      res.status(200).send("You can login");
    } else res.render("login", { error: "Invalid email or password 🙄" });
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", ""); //it deletes the cookies of user
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (!req.cookies.token || req.cookies.token === "") {
    return res.send("You must be logged in");
  } else {
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
  }
}

app.listen(3000);
