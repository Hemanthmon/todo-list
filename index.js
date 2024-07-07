const express = require('express');
require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongodbSession = require('connect-mongodb-session')(session);
const jwt = require('jsonwebtoken')

//File-imports
const { userDataValidation, isEmailRegex } = require('./utils/authUtil');
const userModel = require("./models/userModel");
const isAuth = require('./middleware/authMiddleware');
const todoDataValidation = require("./utils/blogUtils");
const todoModel = require('./models/todoModel');

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
app.use(express.static("public"));
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

        //genrate a token
    //    const token =  generateToken(email);
    //     console.log(token);
    //     console.log("email",jwt.verify(token, process.env.SECRET_KEY));

        return res.redirect('/login')
         } catch (error) {
            console.log("hem, getting trouble in login side", error);
        return res.status(500).json({
            message: "Internal Server Error", 
            error: error,
        });
    }
});

//login side
app.get('/login', (req, res)=>{
    return res.render("loginPage.ejs");
});

app.post('/login-user', async (req, res)=>{
    const loginId = req.body.loginId || req.body.username;
    const { password } = req.body;

    console.log('loginId:', loginId, 'password:', password);
    console.log('req.body:', req.body);

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
        console.log("line 129", userDb);
        if (!userDb)
            return res.status(400).json("User not found, please register first");

        //check for verifief email
        //if(!userDb.isEmailVerified)
        //return res.status(400).json("Please verify email id before login");
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
        console.log("something getting troubled, covole from line 161");
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

//create the api for todo

app.post('/create-item', isAuth, async (req, res) => {
     console.log("Recieved request to create item:", req.body);
     const todo = req.body.todo;
     const username = req.session.user.username;
     
//how to get username 
     try{
      await todoDataValidation({ todo });
      console.log("validation passed");
     }
     catch(error)
     {
        console.log("Validation Failed:", error);
        return res.status(400).json(error);
     }
//create new todo item
    const userObj = new todoModel({
     todo: todo,
     username : username,
    });
//save the todo item in the database
   try{
     const todoDb = await userObj.save();
     console.log("todo saved in database successfully", userObj)
    return res.status(201).json({
        message : "Todo created Successfully",
       data: todoDb,
    })
     }
   catch(error){
    console.log("Error saving todo", error);
    return res.status(500).json({
    message: "Internal server error",
    error : error,
});
}
});

//
app.get('/read-item', isAuth, async (req, res) => {
    const username = req.session.user.username;
try{
   const todoDb = await  userModel.find({ username : username})
console.log(todoDb);

if(todoDb.length === 0){
    return res.send({
        status: 204,
        message: "Todo not found",
    });
}
    return res.send({
        status: 200,
        message : "Read-success",
        data : todoDb,
    });
   
}catch(error){
    console.log("hem the trouble is from read item", error);
return res.send({
    status: 500,
    message: "Internal server error",
    error: error
});
}
    
});
//some error in this unable to find it out
// app.post("/edit-item", isAuth, async (req, res) => {
//     const newData = req.body.newData;
//     const todoId = req.body.todoId;
//     const username = req.session.user.username;
    
//     if(!todoId){
//       return res.status(400).json("Todo id is missing");
//     }

//     try{
//     await todoDataValidation({todo : newData});
//     }catch(error){
//     return res.status(400).json({
//     message : error.messaage,
//     });
// }
//     try{
//         const todoDb = await todoModel.findOne({_id: todoId});
//         console.log(todoDb);

//         if(!todoDb){
//             return res.status(400).json({
//         messaage: `Todo not found with this id : ${todoId}`.
//         });
//   }

//  //cheking the ownership
//  console.log(username, todoDb.username);
//  if(username !== todoDb.username){
//     return res.status(403).json({
//         message: "You are prohibited to edit this todo",
//     });
//  }

//  //update the todo in db
//   const todoDbPrev = await todoModel.findByIdAndUpdate(
//     {_id: todoId },
//     { todo: newData},
//     {new: true}
//   );
//   return res.status(200).json({
//     message: "Todo Updated Successfully",
//     data: todoDbPrev,
//   });
//    }
//    catch (error){
//         console.log(error);
//         return res.status(500).json({
//             message: "internal server error",
//             error: error.message,
//         });
//     }
//    // console.log(newData, todoId);
//    // return res.send("all ok");
// });

app.post("/edit-item", isAuth, async (req, res) => {
    const newData = req.body.newData;
    const todoId = req.body.todoId;
    const username = req.session.user.username;
    
    if (!todoId) {
        return res.status(400).json("Todo id is missing");
    }
    
    try {
        await todoDataValidation({todo: newData});
    } catch (error) {
        return res.status(400).json({
            message: error.message, // Corrected to send the error message
        });
    }

    try {
        const todoDb = await todoModel.findOne({_id: todoId});
        console.log(todoDb);

        if (!todoDb) {
            return res.status(400).json({
                message: `Todo not found with this id: ${todoId}`, // Fixed typo
            });
        }

        // Checking the ownership
        console.log(username, todoDb.username);
        if (username !== todoDb.username) { // Use todoDb.username here
            return res.status(403).json({
                message: "You are prohibited from editing this todo",
            });
        }

        // Update the todo in db
        const todoDbPrev = await todoModel.findByIdAndUpdate(
            {_id: todoId},
            {todo: newData},
            {new: true}
        );

        return res.status(200).json({
            message: "Todo Updated Successfully", // Fixed typo
            data: todoDbPrev,
        });
    } catch (error) {
        console.log("Hem the error is from edit-item", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message, // Fixed typo
        });
    }
    // console.log(newData, todoId);
    // return res.send("all ok");
});

//to delete the todo
app.post("/delete-item", isAuth, async (req, res) => {
    const todoId = req.body.todoId;
    const username = req.session.user.username;
    
    if (!todoId) {
        return res.status(400).json("Todo id is missing");
    }
    

    try {
        const todoDb = await todoModel.findOne({_id: todoId});
        console.log(todoDb);

        if (!todoDb) {
            return res.status(400).json({
                message: `Todo not found with this id: ${todoId}`, // Fixed typo
            });
        }

        // Checking the ownership
        console.log(username, todoDb.username);
        if (username !== todoDb.username) { // Use todoDb.username here
            return res.status(403).json({
                message: "You are not allowed to delete this todo",
            });
        }

        // Update the todo in db
        const todoDbPrev = await todoModel.findByIdAndDelete(
            {_id: todoId},
        );

        return res.status(200).json({
            message: "Todo Deleted Successfully", 
            data: todoDbPrev,
        });
    } catch (error) {
        console.log("Hem the error is from todo updating in db",error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message, 
        });
    }
});

app.listen(PORT, () => {
    console.log(`server is running at:`);
    console.log(`http://localhost:${PORT}/`);
});
