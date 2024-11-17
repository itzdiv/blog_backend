import express from "express";
import bodyParser from "body-parser";
import quotesy from 'quotesy';   
import path from 'path';



const app= express();
const port= 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port,()=>{
    console.log(`Server is running at port : ${port}`);
})

app.get("/",(req,res) =>{
    res.render("index.ejs",{
        blogs: blogs,
    });
});

// Array to store blogs
const blogs = [];

//to get compose.ejs
app.get("/compose", async (req, res) => {
    try {
        const quote = await quotesy.random();  // Fetch a random quote
        res.render("compose.ejs", {
            quote: quote // Pass the quote to the compose.ejs page
        });
    } catch (err) {
        console.error(err);
        res.render("compose.ejs", {
            quote: { text: "An error occurred fetching the quote.", author: "Unknown" }
        });
    }

});

//constantly update compose.ejs quotes
app.get("/api/quote", async (req, res) => {
    try {
        const quote = await quotesy.random(); // Fetch a random quote
        res.json(quote); // Return the quote as JSON
    } catch (err) {
        console.error(err);
        res.status(500).json({ text: "Error fetching quote.", author: "Unknown" });
    }
});


// Post-Blog Route
app.post("/post-blog", (req, res) => {
    const { title, description } = req.body; // Extract title and description
    blogs.push({ title, description }); // Store blog data in the array
    res.redirect("/"); // Redirect to homepage
});

app.get("/blog/:id", (req, res) => {
    const blogId = req.params.id;
    const blog = blogs[blogId];
    if (blog) {
        res.render("blog.ejs", {
            title: blog.title,
            description: blog.description,
        });
    } else {
        res.status(404).send("Blog not found");
    }
});

//for deleting and updating the blogs
app.post("/delete-blog/:id", (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    if (blogs[blogId]) {
        blogs.splice(blogId, 1); // Remove the blog from the array
    }
    res.redirect("/"); // Redirect to homepage
});

// Route to render the edit blog form
app.get("/edit-blog/:id", (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const blog = blogs[blogId];
    if (blog) {
        res.render("edit-blog.ejs", {
            id: blogId,
            title: blog.title,
            description: blog.description,
        });
    } else {
        res.status(404).send("Blog not found");
    }
});

// Route to handle blog update
app.post("/edit-blog/:id", (req, res) => {
    const blogId = parseInt(req.params.id, 10);
    const { title, description } = req.body;
    if (blogs[blogId]) {
        blogs[blogId] = { title, description }; // Update the blog
    }
    res.redirect("/"); // Redirect to homepage
});

