const express = require('express');
require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongodbSession = require('connect-mongodb-session')(session);
const jwt = require('jsonwebtoken');

// File-imports
const { userDataValidation, isEmailRegex } = require('./utils/authUtil');
const userModel = require("./models/userModel");
const isAuth = require('./middleware/authMiddleware');
const {todoDataValidation, genrateToken, sendVerificationMail} = require("./utils/todoUtils");
const todoModel = require('./models/todoModel');
const ratelimiting = require('./middleware/rateLimiting');

// Constants
const app = express();
const PORT = process.env.PORT;
const Store = new mongodbSession({
    uri: process.env.MONGO_URI,
    collection: "sessions",
});

// DB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Mongo DB connected successfully");
    })
    .catch((err) => console.log(err));

// Middlewares
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // body parser
app.use(express.json()); // parser json format
app.use(express.static("public"));
app.use(
    session({
        secret: process.env.SECRET_KEY,
        store: Store,
        resave: false,
        saveUninitialized: false,
    })
);

app.get('/', (req, res) => {
    return res.render("homePage.ejs");
});

// Rendering
app.get('/register', (req, res) => {
    return res.render("registerPage.ejs");
});

app.post('/register-user', async (req, res) => {
    console.log(req.body);
    const { name, email, username, password } = req.body;

    // Data validation
    try {
        await userDataValidation({ name, email, username, password });
    } catch (error) {
        return res.status(400).json(error); // Ensure consistent JSON format
    }

    try {
        // Check if email and username are unique
        const userEmailExist = await userModel.findOne({ email });
        if (userEmailExist) {
            return res.status(400).json("Email already exists");
        }

        const userUserNameExist = await userModel.findOne({ username });
        if (userUserNameExist) {
            return res.status(400).json("Username already exists");
        }

        // Encrypt the password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT));

        // Store in database
        const userObj = new userModel({
            name,
            email,
            username,
            password: hashedPassword,
        });

       const userDb = await userObj.save();

        //genrate the token
        const token = genrateToken(email)
        console.log(token);
        console.log("email", jwt.verify(token, process.env.SECRET_KEY));

        //send mail
        sendVerificationMail(email, token)


        return res.redirect('/login');
    } catch (error) {
        console.log("Error in register-user:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.get('/verifytoken/:token', async (req, res)=>{
    console.log(req.params.token);
    const token = req.params.token;
    const email = jwt.verify(token, process.env.SECRET_KEY);
    console.log(email);
    try{
        await userModel.findOneAndUpdate ({email : email}, {isEmailVerified : true});
         return res.render("successemail.ejs");
    }catch(error){
        return res.status(500).json(error)
    }


})
// Login side
app.get('/login', (req, res) => {
    return res.render("loginPage.ejs");
});

app.post('/login-user', async (req, res) => {
    const loginId = req.body.loginId || req.body.username;
    const { password } = req.body;

    console.log('loginId:', loginId, 'password:', password);
    console.log('req.body:', req.body);

    if (!loginId || !password)
        return res.status(400).json("Missing login credentials");

    if (typeof loginId !== 'string')
        return res.status(400).json("Login Id is not a string");

    if (typeof password !== 'string')
        return res.status(400).json("Password is not a string");

    // Find the user from the db
    try {
        let userDb = {};
        if (isEmailRegex({ key: loginId })) {
            userDb = await userModel.findOne({ email: loginId });
            console.log("Found user with email");
        } else {
            userDb = await userModel.findOne({ username: loginId });
            console.log("Found user with username");
        }
        console.log("User found:", userDb);
        if (!userDb)
            return res.status(400).json("User not found, please register first");
       
        //check for verified email
        if(!userDb.isEmailVerified)
            return res.status(400).json("Verify your email ID, before login")

        // Compare the password
        const isMatched = await bcrypt.compare(password, userDb.password);
        if (!isMatched) return res.status(400).json("Incorrect password");

        req.session.isAuth = true;
        req.session.user = {
            userId: userDb._id,
            username: userDb.username,
            email: userDb.email,
        };
        return res.redirect("/dashboard");
    } catch (error) {
        console.log("Error in login-user:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.get('/dashboard', isAuth, (req, res) => {
    console.log("Dashboard API");
    return res.render("dashboardPage.ejs");
});

app.post("/logout", isAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json("Logout unsuccessful");
        return res.redirect("/login");
    });
});

// Create the API for todo
app.post('/create-item', isAuth, ratelimiting, async (req, res) => {
    console.log("Received request to create item:", req.body);
    const { todo } = req.body;
    const { username } = req.session.user;

    try {
        await todoDataValidation({ todo });
        console.log("Validation passed", todo);
    } catch (error) {
        console.log("Validation Failed:", error);
        return res.status(400).json(error);
    }

    // Create new todo item
    const userObj = new todoModel({
        todo,
        username,
    });

    // Save the todo item in the database
    try {
        const todoDb = await userObj.save();
        console.log("Todo saved in database successfully", userObj);
        return res.status(201).json({
            message: "Todo created successfully",
            data: todoDb,
        });
    } catch (error) {
        console.log("Error saving todo", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.get('/read-item', isAuth, async (req, res) => {
    const { username } = req.session.user;
    const SKIP = Number(req.query.skip) || 0;
    const LIMIT = 5;

    console.log(SKIP);
    try {
        //const todoDb = await todoModel.find({ username });

        const todoDb = await todoModel.aggregate([
            {
                $match: { username: username},
            },
            {
                $skip: SKIP,
            },
            {
                $limit: LIMIT,
            },
        ]);
        console.log(todoDb);

        if (todoDb.length === 0) {
            return res.status(204).json({
                message: "No todos found",
            });
        }
        return res.status(200).json({
            message: "Read success",
            data: todoDb,
        });
    } catch (error) {
        console.log("Error in read-item:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.post("/edit-item", isAuth, async (req, res) => {
    const { newData, todoId } = req.body;
    const { username } = req.session.user;

    if (!todoId) {
        return res.status(400).json("Todo ID is missing");
    }

    try {
        await todoDataValidation({ todo: newData });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    try {
        const todoDb = await todoModel.findOne({ _id: todoId });
        console.log(todoDb);

        if (!todoDb) {
            return res.status(400).json({
                message: `Todo not found with ID: ${todoId}`,
            });
        }

        // Checking ownership
        if (username !== todoDb.username) {
            return res.status(403).json({
                message: "You are prohibited from editing this todo",
            });
        }

        // Update the todo in db
        const updatedTodo = await todoModel.findByIdAndUpdate(
            todoId,
            { todo: newData },
            { new: true }
        );

        return res.status(200).json({
            message: "Todo updated successfully",
            data: updatedTodo,
        });
    } catch (error) {
        console.log("Error in edit-item:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.post("/delete-item", isAuth, async (req, res) => {
    const { todoId } = req.body;
    const { username } = req.session.user;

    if (!todoId) {
        return res.status(400).json("Todo ID is missing");
    }

    try {
        const todoDb = await todoModel.findOne({ _id: todoId });
        console.log(todoDb);

        if (!todoDb) {
            return res.status(400).json({
                message: `Todo not found with ID: ${todoId}`,
            });
        }

        // Checking ownership
        if (username !== todoDb.username) {
            return res.status(403).json({
                message: "You are not allowed to delete this todo",
            });
        }

        // Delete the todo in db
        const deletedTodo = await todoModel.findByIdAndDelete(todoId);

        return res.status(200).json({
            message: "Todo deleted successfully",
            data: deletedTodo,
        });
    } catch (error) {
        console.log("Error in delete-item:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at:`);
    console.log(`http://localhost:${PORT}/`);
});
