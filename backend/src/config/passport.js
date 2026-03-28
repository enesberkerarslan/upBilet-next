const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://www.upbilet.com"
  },
  (accessToken, refreshToken, profile, done) => {
    // Sadece profile objesini ilet
    return done(null, profile);
  }
));

module.exports = passport; 