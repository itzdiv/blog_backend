# 📝 Blog Ninja — A Minimalist, Secure Blogging Platform

**Blog Ninja** is a sleek, full-stack blogging platform built using the **PERN** stack (PostgreSQL, Express, React, Node.js)—but currently leverages EJS for simple server-side rendering. It allows user authentication (local & Google OAuth), blog creation and management, and displays random motivational quotes to boost creativity while writing.

---

## 🚀 Features

- 🔐 **User Authentication** — Secure login/signup using Local Strategy and Google OAuth via Passport.js  
- 📝 **Blog CRUD** — Create, view, edit, and delete blog posts  
- 💬 **Quotes** — Random quotes injected from `quotesy` to inspire writing  
- 💾 **Sessions** — Secure session management using PostgreSQL store  
- 🖤 **Clean UI** — Minimal, modern black-and-white EJS-based layout  
- 📑 **API Docs** — Built-in `/documentation` route for exploring API endpoints  

---

## 📦 Tech Stack

- **Backend**: Node.js, Express.js  
- **Database**: PostgreSQL  
- **Frontend**: EJS templates  
- **Authentication**: Passport.js (Local + Google OAuth 2.0)  
- **Security**: bcrypt, express-session  
- **Extras**: quotesy, dotenv, connect-pg-simple  

---

## 📂 Project Structure
```blog
blog-ninja/
├── public/           # Static files (CSS, images)
├── views/            # EJS templates (home, compose, login, etc.)
├── auth.js           # Authentication logic
├── index.js          # Blog CRUD routes
├── server.js         # Entry point for the backend API
├── .env              # Environment variables
├── package.json
└── README.md
```



---

## 🛠️ Getting Started

Follow these steps to run the project locally:

### 1. Clone the Repository
```
git clone https://github.com/your-username/blog-ninja.git
cd blog-ninja
```

### 2. Install Dependencies
```
npm install
```


### 3. Set Up Environment Variables

Create a `.env` file in the root directory and add the following:
```
PostgreSQL Config
PG_USER=your_postgres_username
PG_HOST=localhost
PG_DATABASE=your_database_name
PG_PASSWORD=your_postgres_password
PG_PORT=5432

Session Secret
SESSION_SECRET=your_secret_key_here
```
Google OAuth Credentials
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

⚠️ Make sure PostgreSQL is installed and running on your system, and that your database exists.

### 4. Start the Server
```
node index.js
node server.js(for backend api)
```
By default, the app will run at: `http://localhost:3001`

---

## ✅ TODOs

- [ ] Add support for Markdown in blog posts  
- [ ] Add user profile pages  
- [ ] Add post search & category filters  
- [ ] Integrate React frontend (SPA) in v2  
- [ ] Add Swagger or ReDoc-based API docs  

---

## 📸 Screenshots

<img src="https://raw.githubusercontent.com/itzdiv/blog_backend/main/public/render/img1.png" alt="Project Preview" style="width:100%; max-width:600px;">

---

## 📜 License

MIT License — Feel free to fork, modify, and use this project however you like.

---

## 💬 Want to Contribute?

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

✨ Made with coffee, code, and creativity.











