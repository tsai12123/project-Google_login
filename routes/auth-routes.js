const router = require("express").Router();
const { render } = require("ejs");
const passport = require("passport");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.get("/login", (req, res) => {
  return res.render("login", { user: req.user });
});

router.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return res.send(err);
    } else {
      return res.redirect("/");
    }
  });
});

router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  if (password.length < 8) {
    req.flash("error_msg", "密碼長度過短，至少需要8個數字或英文字");
    return res.redirect("/auth/signup");
  }
  //確認信箱是否有人使用
  let foundEmail = await User.findOne({ email }).exec();
  if (foundEmail) {
    req.flash("error_msg", "信箱已有人使用請換信箱");
    return res.redirect("/auth/signup");
  }

  let hashedPassword = await bcrypt.hash(password, saltRounds);
  let newUser = new User({
    name,
    email,
    password: hashedPassword,
  });
  await newUser.save();
  req.flash("success_msg", "恭喜你註冊成功");
  return res.redirect("/auth/login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/auth/login",
    failureFlash: "登入失敗。帳號或密碼不正確", //failureFlash的值會自動套在req.flash("error");
  }),
  (req, res) => {
    return res.redirect("/profile");
  }
);

router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  return res.redirect("/profile");
});

router.get("*", (req, res) => {
  return res.render("error", { user: req.user });
});
module.exports = router;
