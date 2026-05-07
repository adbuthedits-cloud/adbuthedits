const passport = require('passport');
const { User } = require('../models');
const { Op } = require('sequelize');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;

const backendUrl = (process.env.BACKEND_URL || 'https://adbuth-backend.onrender.com').replace(/\/$/, '');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
      proxy: process.env.NODE_ENV === 'production'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          let user = await User.findOne({ where: { [Op.or]: [{ google_id: googleId }, { email: email }] } });
  
          if (user) {
              if (!user.google_id) {
                  user.google_id = googleId;
                  user.auth_provider = 'google';
                  await user.save();
              }
              return done(null, user);
          }
  
          user = await User.create({
              google_id: googleId,
              email: email,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              auth_provider: 'google'
          });
          return done(null, user);
      } catch (err) { return done(err, null); }
    }
  ));
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${backendUrl}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name'],
      proxy: process.env.NODE_ENV === 'production'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
          const email = profile.emails ? profile.emails[0].value : null;
          const facebookId = profile.id;

          let user = await User.findOne({ 
              where: { 
                  [Op.or]: [
                      { facebook_id: facebookId },
                      ...(email ? [{ email: email }] : [])
                  ]
              } 
          });

          if (user) {
              if (!user.facebook_id) {
                  user.facebook_id = facebookId;
                  user.auth_provider = 'facebook';
                  await user.save();
              }
              return done(null, user);
          }

          user = await User.create({
              facebook_id: facebookId,
              email: email,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              auth_provider: 'facebook'
          });
          return done(null, user);
      } catch (err) { return done(err, null); }
    }
  ));
}



passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
