const passport = require('passport');
const { User } = require('../models');
const { Op } = require('sequelize');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
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
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
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

// Twitter Strategy (Manual OAuth 2.0 with PKCE)
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  const twitterStrategy = new OAuth2Strategy({
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      clientID: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/twitter/callback`,
      state: true,
      pkce: true,
      scope: ['users.read', 'tweet.read']
  }, async (accessToken, refreshToken, profile, done) => {
      try {
          const twitterId = profile.id;
          const email = profile.email || null;

          let user = await User.findOne({ 
              where: { 
                  [Op.or]: [
                      { twitter_id: twitterId },
                      ...(email ? [{ email: email }] : [])
                  ]
              } 
          });

          if (user) {
              if (!user.twitter_id) {
                  user.twitter_id = twitterId;
                  user.auth_provider = 'twitter';
                  await user.save();
              }
              return done(null, user);
          }

          user = await User.create({
              twitter_id: twitterId,
              email: email,
              first_name: profile.name.split(' ')[0],
              last_name: profile.name.split(' ')[1] || '',
              auth_provider: 'twitter'
          });
          return done(null, user);
      } catch (err) { return done(err, null); }
  });

  // Manual Profile Fetcher for X API v2
  twitterStrategy.userProfile = function(accessToken, done) {
      this._oauth2.get('https://api.twitter.com/2/users/me', accessToken, (err, body) => {
          if (err) return done(err);
          try {
              const json = JSON.parse(body);
              const profile = {
                  id: json.data.id,
                  name: json.data.name,
                  username: json.data.username
              };
              done(null, profile);
          } catch (e) { done(e); }
      });
  };

  passport.use('twitter', twitterStrategy);
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
