// server.js
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const app = express();

const GOOGLE_CLIENT_ID = "";
const GOOGLE_CLIENT_SECRET = "";
const API_URL = "";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const response = await axios.post(`${API_URL}/auth/google`, {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        });

        return cb(null, response.data);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware для проверки авторизации
const authMiddleware = (req, res, next) => {
  if (!req.session.token && !req.user) {
    return res.redirect("/login");
  }
  next();
};

// OAuth маршруты
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    req.session.token = req.user.token;
    res.redirect("/");
  }
);

// API middleware для проксирования запросов
const apiMiddleware = async (req, res, next) => {
  const token = req.session.token || (req.user && req.user.token);
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
};

// Роуты для страниц
app.get("/login", (req, res) => {
  res.render("login", { error: req.query.error });
});

app.get("/register", (req, res) => {
  res.render("register", { error: req.query.error });
});

app.get("/", authMiddleware, (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/chat/:id", authMiddleware, (req, res) => {
  res.render("chat", {
    chatId: req.params.id,
    user: req.user,
  });
});

app.listen(4000, () => {
  console.log("Frontend server running on port 4000");
});
