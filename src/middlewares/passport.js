const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: "859146704518-2a8d8oj6qplnonprltgip7i9jlh5ai8m.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:8000/v1/auth/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log(accessToken,refreshToken,profile)
      return done(null, profile); // send full profile to controller
    }
  )
);

passport.serializeUser((user, done) => {
    console.log("hello")
  done(null, user);
});

passport.deserializeUser((user, done) => {
    console.log("hello")
  done(null, user);
});
