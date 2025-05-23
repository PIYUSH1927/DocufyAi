const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User"); // User model
require("dotenv").config();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://sooru-ai.onrender.com/api/auth/github/callback",
      scope: ["user:email", "repo"], // Access to email & repo list
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // First check if an account with this email exists
          const existingUser = await User.findOne({ email: profile.emails?.[0]?.value });
        
          if (existingUser) {
            // Update existing user to link GitHub account
            existingUser.githubId = profile.id;
            existingUser.accessToken = accessToken;
            existingUser.username = profile.username || existingUser.username;  
  existingUser.avatar = profile.photos?.[0]?.value || existingUser.avatar;
            await existingUser.save();
            return done(null, existingUser);
          }
        
          // If email doesn't exist, create a new user
          user = new User({
            githubId: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value || "No public email",
            avatar: profile.photos?.[0]?.value,
            accessToken, // Store GitHub token
          });

          await user.save();
        
          
        } else {
          user.accessToken = accessToken;
        }

        await user.save();
        
        return done(null, user);
      } catch (error) {
        console.error("GitHub OAuth Error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
