import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";
import quotesy from 'quotesy';

dotenv.config();

const app = express();
const port = 3001;
const saltRounds = 10;

// Database configuration
const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  "local",
  new Strategy(async (username, password, cb) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [username]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        return valid ? cb(null, user) : cb(null, false);
      }
      return cb("User not found");
    } catch (err) {
      return cb(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [profile.email]);
        if (result.rows.length === 0) {
          const newUser = await pool.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        }
        return cb(null, result.rows[0]);
      } catch (err) {
        return cb(err);
      }
    }
  )
);


  

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Routes
app.get("/", (req, res) => {
  req.isAuthenticated() ? res.redirect("/secrets") : res.render("home.ejs");
});

app.get("/login", (req, res) => res.render("login.ejs"));
app.get("/register", (req, res) => res.render("register.ejs"));

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await pool.query("SELECT * FROM blog_posts ORDER BY id DESC");
      res.render("index.ejs", { blogs: result.rows });
    } catch (err) {
      console.error(err);
      res.send("Error retrieving blogs");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/secrets")
);

app.post("/login", passport.authenticate("local", {
  successRedirect: "/secrets",
  failureRedirect: "/login"
}));

app.post("/register", async (req, res) => {
  try {
    const { username: email, password } = req.body;
    const checkResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (checkResult.rows.length > 0) return res.redirect("/login");
    
    const hash = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hash]
    );
    
    req.login(result.rows[0], (err) => {
      if (err) throw err;
      res.redirect("/secrets");
    });
  } catch (err) {
    console.error(err);
    res.redirect("/register");
  }
});

//logout
app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error logging out");
      }
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error destroying session");
        }
        res.redirect("/");
      });
    });
  });



// Blog routes
app.get("/compose", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  
  try {
    const quote = await quotesy.random();
    res.render("compose.ejs", { quote });
  } catch (err) {
    res.render("compose.ejs", { quote: { text: "Error fetching quote", author: "System" } });
  }
});

app.post("/post-blog", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  
  try {
    const { title, description } = req.body;
    await pool.query("INSERT INTO blog_posts (title, description) VALUES ($1, $2)", [title, description]);
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.send("Error posting blog");
  }
});

//documentation for the API route
app.get("/documentation", (req, res) => {
    res.render("documentation.ejs");
});



// API route for constant quote updates
app.get("/api/quote", async (req, res) => {
    try {
        const quote = await quotesy.random();
        res.json(quote);
    } catch (err) {
        console.error(err);
        res.status(500).json({ text: "Error fetching quote.", author: "Unknown" });
    }
});



// View single blog
app.get("/blog/:id", async (req, res) => {
    const blogId = req.params.id;
    try {
        const result = await pool.query("SELECT * FROM blog_posts WHERE id = $1", [blogId]);
        const blog = result.rows[0];
        if (blog) {
            res.render("blog.ejs", {
                title: blog.title,
                description: blog.description,
            });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (err) {
        console.error(err);
        res.send("Error retrieving blog");
    }
});

// Delete blog
app.post("/delete-blog/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    try {
        await pool.query("DELETE FROM blog_posts WHERE id = $1", [blogId]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.send("Error deleting blog");
    }
});

// Edit form route
app.get("/edit-blog/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    try {
        const result = await pool.query("SELECT * FROM blog_posts WHERE id = $1", [blogId]);
        const blog = result.rows[0];
        if (blog) {
            res.render("edit-blog.ejs", {
                id: blog.id,
                title: blog.title,
                description: blog.description,
            });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (err) {
        console.error(err);
        res.send("Error retrieving blog");
    }
});

// Update blog
app.post("/edit-blog/:id", async (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const { title, description } = req.body;
    try {
        await pool.query(
            "UPDATE blog_posts SET title = $1, description = $2 WHERE id = $3",
            [title, description, blogId]
        );
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.send("Error updating blog");
    }
});

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
});
