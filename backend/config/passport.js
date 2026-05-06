const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const { Op } = require('sequelize');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      proxy: process.env.NODE_ENV === 'production'
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('[Passport] Attempting Google Login. Callback URL:', `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`);
      try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
  
          let user = await User.findOne({ 
              where: { 
                  [Op.or]: [
                      { google_id: googleId },
                      { email: email }
                  ]
              } 
          });
  
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
      } catch (err) {
          return done(err, null);
      }
    }
  ));
} else {
  console.warn('[Passport] Google OAuth keys missing. Google Login will be disabled.');
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
