const passport = require('passport');
const { User } = require('../models');
const { Op } = require('sequelize');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
// OAuth2Strategy kept for potential future use

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
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const googleId = profile.id;
          const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
          const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
          const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';

          if (!email) {
              return done(null, false, { message: 'No email returned from Google' });
          }

          let user = await User.findOne({ where: { [Op.or]: [{ google_id: googleId }, { email }] } });

          if (user) {
              // Check if account is deactivated — do NOT issue a token; flag for special redirect
              if (user.is_deactivated) {
                  // Pass user with a deactivation marker so the callback can redirect properly
                  user._isDeactivated = true;
                  return done(null, user);
              }
              if (!user.google_id) {
                  user.google_id = googleId;
                  user.auth_provider = 'google';
              }
              // Update names if user's current first_name is empty, null, or generic 'User'
              if (firstName && (!user.first_name || user.first_name === 'User' || user.first_name.trim() === '')) {
                  user.first_name = firstName;
              }
              if (lastName && (!user.last_name || user.last_name.trim() === '')) {
                  user.last_name = lastName;
              }
              // Always update profile picture in case it changed
              if (profilePicture) user.profile_picture = profilePicture;
              await user.save();
              return done(null, user);
          }

          user = await User.create({
              google_id: googleId,
              email,
              first_name: firstName || 'User',
              last_name: lastName || '',
              profile_picture: profilePicture,
              auth_provider: 'google'
          });
          return done(null, user);
      } catch (err) { 
          console.error('[Google Auth Error]', err);
          return done(err, null); 
      }
    }
  ));
}


// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${backendUrl}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      proxy: process.env.NODE_ENV === 'production'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const facebookId = profile.id;
          const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          let user = await User.findOne({ 
              where: { 
                  [Op.or]: [
                      { facebook_id: facebookId },
                      ...(email ? [{ email }] : [])
                  ]
              } 
          });

          if (user) {
              if (!user.facebook_id) {
                  user.facebook_id = facebookId;
                  user.auth_provider = 'facebook';
              }
              // Always update profile picture in case it changed
              if (profilePicture) user.profile_picture = profilePicture;
              await user.save();
              return done(null, user);
          }

          user = await User.create({
              facebook_id: facebookId,
              email,
              first_name: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
              last_name: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
              profile_picture: profilePicture,
              auth_provider: 'facebook'
          });
          return done(null, user);
      } catch (err) {
          console.error('[Facebook Auth Error]', err);
          return done(err, null);
      }
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
