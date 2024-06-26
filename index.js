const express = require('express');
require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongodbSession = require('connect-mongodb-session')(session);

//File-imports
const { userDataValidation, isEmailRegex } = require('./utils/authUtil');
const userModel = require("./models/userModel");
const isAuth = require('./middleware/authMiddleware');

//constants
const app = express();
const PORT = process.env.PORT;
const Store = new mongodbSession({
    uri : process.env.MONGO_URI,
    collection : "sessions",
});
//Db Connection
mongoose
 .connect(process.env.MONGO_URI)
 .then(() => {
    console.log("Mongo DB connected succefully");
})
.catch((err) => console.log(err));

//middlewares
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true })); // body  parser
app.use(express.json()); //parser json format

app.use(
  session({
    secret : process.env.SECRET_KEY,
    store : Store,
    resave: false,
    saveUninitialized: false, 
})
);

app.get('/', (req, res) => {
     return res.render("homePage.ejs");
});
//rendering
app.get('/register', (req, res)=>{
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
            return res.status(400).json("Email already exists"); // Typo fixed
        }

        const userUserNameExist = await userModel.findOne({ username });
        if (userUserNameExist) {
            return res.status(400).json("Username already exists"); // Typo fixed
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
        return res.redirect('/login')
         } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error", // Typo fixed
            error: error
        });
    }
});
//login side
app.get('/login', (req, res)=>{
    return res.render("loginPage.ejs");
});

app.post('/login-user', async (req, res)=>{
    const {loginId, password} = req.body;
    if(!loginId || !password)
        return res.status(400).json("Missing login crendtials");
    

    if(typeof loginId !== 'string')
        return res.status(400).json("Login Id is not a string");

    if(typeof password !== 'string')
        return res.status(400).json("password is not a string");

    //find the user from the db
     try{
        let userDb = {};
        if(isEmailRegex({ key : loginId }))
        {
           userDb = await userModel.findOne({email : loginId});
           console.log("find user with email");
        }
        else{
           userDb = await userModel.findOne({username : loginId});
           console.log("find user with username");
        }
        if (!userDb)
            return res.status(400).json("User not found, please register first");
        
        //compare the password
         console.log(password, userDb.password);
         const isMatched = await bcrypt.compare(password, userDb.password);
         console.log(isMatched);
         if(!isMatched) return res.status(400).json("Incorrect password");

         console.log(req.session);
         req.session.isAuth = true;
         req.session.user = {
            userId : userDb._id,
            username: userDb.username,
            email: userDb.email,
        };
        return res.redirect("/dashboard")
     }
     catch(error){
      return res.status(500).json(console.error());
     }

  //session based aunthitication

});

app.get('/dashboard', isAuth, (req, res) => {
    console.log("dasboard Api");
    return res.render("dashboardpage");
});

app.post("/logout", isAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json("Logout unsuccessfull");
        return res.status(200).json("logout successful");
    })
})

app.listen(PORT, () => {
    console.log(`server is running at:`);
    console.log(`http://localhost:${PORT}/`);
});
