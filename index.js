import express from "express";
import bodyParser from "body-parser";
import quotesy from 'quotesy';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

const app = express();
const port = 3001;

// PostgreSQL setup
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Home route
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM blog_posts ORDER BY id DESC");
        res.render("index.ejs", {
            blogs: result.rows,
        });
    } catch (err) {
        console.error(err);
        res.send("Error retrieving blogs");
    }
});

//documentation for the API route
app.get("/documentation", (req, res) => {
    res.render("documentation.ejs");
});

// Compose route
app.get("/compose", async (req, res) => {
    try {
        const quote = await quotesy.random();
        res.render("compose.ejs", { quote });
    } catch (err) {
        console.error(err);
        res.render("compose.ejs", {
            quote: { text: "An error occurred fetching the quote.", author: "Unknown" }
        });
    }
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

// Post a new blog
app.post("/post-blog", async (req, res) => {
    const { title, description } = req.body;
    try {
        await pool.query("INSERT INTO blog_posts (title, description) VALUES ($1, $2)", [title, description]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.send("Error posting blog");
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
