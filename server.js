import express from "express";
import bodyParser from "body-parser";
import quotesy from "quotesy";
import pkg from "pg";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3002;

// PostgreSQL setup
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ------------------------
// 📄 API ROUTES
// ------------------------

/**
 * @route GET /api/posts
 * @desc Return all blog posts
 */
app.get("/api/posts", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM blog_posts ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error retrieving blogs" });
    }
});

/**
 * @route GET /api/posts/:id
 * @desc Return a specific blog post
 */
app.get("/api/posts/:id", async (req, res) => {
    const blogId = parseInt(req.params.id);
    try {
        const result = await pool.query("SELECT * FROM blog_posts WHERE id = $1", [blogId]);
        const blog = result.rows[0];
        blog ? res.json(blog) : res.status(404).json({ error: "Blog not found" });
    } catch {
        res.status(500).json({ error: "Error retrieving blog" });
    }
});

/**
 * @route POST /api/posts
 * @desc Create a new blog post
 */
app.post("/api/posts", async (req, res) => {
    const { title, description } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO blog_posts (title, description) VALUES ($1, $2) RETURNING *",
            [title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch {
        res.status(500).json({ error: "Error posting blog" });
    }
});

/**
 * @route PUT /api/posts/:id
 * @desc Update a blog post
 */
app.put("/api/posts/:id", async (req, res) => {
    const blogId = parseInt(req.params.id);
    const { title, description } = req.body;
    try {
        const result = await pool.query(
            "UPDATE blog_posts SET title = $1, description = $2 WHERE id = $3 RETURNING *",
            [title, description, blogId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json(result.rows[0]);
    } catch {
        res.status(500).json({ error: "Error updating blog" });
    }
});

/**
 * @route DELETE /api/posts/:id
 * @desc Delete a blog post
 */
app.delete("/api/posts/:id", async (req, res) => {
    const blogId = parseInt(req.params.id);
    try {
        const result = await pool.query("DELETE FROM blog_posts WHERE id = $1 RETURNING *", [blogId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.json({ message: "Blog deleted successfully", deleted: result.rows[0] });
    } catch {
        res.status(500).json({ error: "Error deleting blog" });
    }
});

/**
 * @route GET /api/quote
 * @desc Returns a random quote as JSON
 */
app.get("/api/quote", async (req, res) => {
    try {
        const quote = await quotesy.random();
        res.json(quote);
    } catch {
        res.status(500).json({ text: "Error fetching quote", author: "Unknown" });
    }
});

/**
 * Optional route to serve your documentation page
 * Keep if you're using it with Swagger or EJS
 */
app.get("/documentation", (req, res) => {
    res.render("documentation.ejs");
});

app.listen(port, () => {
    console.log(`🟢 JSON API Server running on http://localhost:${port}`);
});
