const passport = require("passport");
const axios = require("axios"); // ✅ Ensure axios is imported
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User"); // User model
require("dotenv").config();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://sooru-ai.onrender.com/api/auth/github/callback",
      scope: ["user:email", "read:user"], // ✅ Ensure correct scope
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value || null;

        // ✅ If email is missing, fetch it manually from GitHub API
        if (!email) {
          const emailRes = await axios.get("https://api.github.com/user/emails", {
            headers: { Authorization: `token ${accessToken}` },
          });

          const primaryEmail = emailRes.data.find((e) => e.primary && e.verified)?.email;
          if (primaryEmail) {
            email = primaryEmail;
          } else {
            return done(new Error("GitHub email not available"), null);
          }
        }

        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // ✅ Check if user with the same email exists
          const existingUser = await User.findOne({ email });

          if (existingUser) {
            // ✅ Link GitHub to existing account
            existingUser.githubId = profile.id;
            existingUser.accessToken = accessToken;
            await existingUser.save();
            return done(null, existingUser);
          }

          // ✅ Create new user if no matching email is found
          user = new User({
            githubId: profile.id,
            username: profile.username,
            email,
            avatar: profile.photos?.[0]?.value,
            accessToken, // Store GitHub token
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("GitHub OAuth Error:", error);
        return done(error, null);
      }
    }
  )
);

// ✅ Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
