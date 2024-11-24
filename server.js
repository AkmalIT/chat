const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const GOOGLE_CLIENT_ID = "";
const GOOGLE_CLIENT_SECRET = "";
const API_URL = "http://localhost:3000";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authMiddleware = (req, res, next) => {
  if (!req.session.token && !req.user) {
    return res.redirect("/login");
  }
  next();
};

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    if (req.user && req.user.token) {
      res.redirect(`/?token=${req.user.token}`);
    } else {
      res.redirect("/login?error=Authentication failed");
    }
  }
);

const apiMiddleware = async (req, res, next) => {
  const token = req.session.token || (req.user && req.user.token);
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
};

app.get("/login", (req, res) => {
  res.render("login", { error: req.query.error });
});

app.get("/register", (req, res) => {
  res.render("register", { error: req.query.error });
});

app.get("/", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/chats/my`, {
      headers: {
        Authorization: `Bearer ${req.user.token}`,
      },
    });

    res.render("index", {
      user: req.user,
      chats: response.data,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.render("index", {
      user: req.user,
      chats: [],
      error: "Failed to load chats",
    });
  }
});

app.get("/chat/:id", authMiddleware, async (req, res) => {
  try {
    const chatResponse = await axios.get(`${API_URL}/chats/${req.params.id}`, {
      headers: {
        Authorization: `Bearer ${req.user.token}`,
      },
    });

    const messagesResponse = await axios.get(
      `${API_URL}/chats/${req.params.id}/messages`,
      {
        headers: {
          Authorization: `Bearer ${req.user.token}`,
        },
      }
    );

    res.render("chat", {
      chatId: req.params.id,
      user: req.user,
      chat: chatResponse.data,
      messages: messagesResponse.data,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    if (error.response?.status === 404) {
      res.redirect("/?error=Chat not found");
    } else if (error.response?.status === 403) {
      res.redirect("/?error=Access denied");
    } else {
      res.redirect("/?error=Failed to load chat");
    }
  }
});

app.listen(4000, () => {
  console.log("Frontend server running on port 4000");
});
