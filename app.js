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

app.get("/profile", isLoggedIn, async (req, res) => {
  //we get user data in our terminal
  let user = await userModel.findOne({ email: req.user.email }).populate({
    path: "posts",
    populate: {
      path: "user", //  populate user inside each post
      select: "username name email", // only return these fields
    },
  });
  //console.log(user);
  res.render("profile", { user });
  //console.log("Username:", user.username);
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user"); //finding the id of user
  res.render("edit", { post }); //taking to a new page of edit section!
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  const { content } = req.body;

  await postModel.findByIdAndUpdate(req.params.id, {
    content: content,
  });

  res.redirect("/profile");
});

app.post("/post", isLoggedIn, async (req, res) => {
  //islogged in only allows to modify post if user is logged into his/her account
  //we get user data in our terminal
  let user = await userModel.findOne({ email: req.user.email }); //wo is logged in got by this line
  let { content } = req.body;
  let post = await postModel.create({
    // post knows who is the user
    user: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
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
      res.status(200).redirect("/profile");
    } else res.render("login", { error: "Invalid email or password 🙄" });
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", ""); //it deletes the cookies of user
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (!req.cookies.token || req.cookies.token === "") {
    return res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
  }
}

app.listen(3000);
