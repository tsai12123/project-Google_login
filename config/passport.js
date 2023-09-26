const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user-model");
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt");
passport.serializeUser((user, done) => {
  console.log("Serialize使用者...");
  done(null, user._id); //將mogoDB的id，存在session內部，並將iD簽名後，以cookie形式給使用者。
}); //use的值有可能是foundUser或是savedUser。這是註冊或未註冊會跑到這。

passport.deserializeUser(async (_id, done) => {
  console.log(
    "Deserialize使用者..使用serializeUser儲存的id.去找到資料庫內的資料"
  );
  let foundUser = await User.findOne({ _id });
  done(null, foundUser);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://localhost:8080/auth/google/redirect",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      let foundUser = await User.findOne({ googleID: profile.id }).exec();
      if (foundUser) {
        console.log("使用者註冊過了");
        done(null, foundUser);
      } else {
        console.log("偵測到新用戶，需增加用戶");
        let newUser = new User({
          name: profile.displayName,
          googleID: profile.id,
          thumbnail: profile.photos[0].value,
          email: profile.emails[0].value,
          password: "mypassword",
        });
        let savedUser = await newUser.save();
        console.log("成功創建新用戶");
        done(null, savedUser);
      }
    }
  )
);

passport.use(
  new localStrategy(async (username, password, done) => {
    let foundUser = await User.findOne({ email: username });
    if (foundUser) {
      let result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        done(null, foundUser);
      } else {
        done(null, false);
      }
    } else {
      done(null, false);
    }
  })
);
