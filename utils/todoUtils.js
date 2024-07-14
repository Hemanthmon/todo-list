const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const todoDataValidation = ({ todo }) => {
    return new Promise((resolve, reject) => {
        if(!todo) reject("Todo is missing");
        if (typeof todo !== "string") reject("Todo is not a text");
        if (todo.length < 3 || todo.length > 100)
            reject("Todo lenght should be 3-100 characters only");

        resolve();
    });
};

const generateToken= ( email ) => {
    const token = jwt.sign({ email }, process.env.SECRET_KEY)
    return token;
}

const sendVerificationMail = (email, token) => {
    //we have to create the transporter
    const transporter = nodemailer.createTransport({
        host : "smtp.gmail.com",
        port:465,
        secure: true,
        service: "gmail",
        auth:{
            user:"hemanthvmon@gmail.com",
            pass:"saht kdhs xzte iqdk"
        }
    });

    const verificationUrl = `https://todo-app-h4dw.onrender.com/verifytoken/${token}`;

    //mail options
    const mailOptions = {
        from : 'hemanthvmon@gmail.com',
        to: email,
        subject: "Email Verification for Todo-App",
        html : `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <title>Email Verification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #0F1E23;
            color: white;
            text-align: center;
        }
        .header {
            padding: 20px;
            background-image: url('./photos/gmail\ pic.jpg'); /* Replace with your background image URL */
            background-size: cover;
            background-position: center;
            color: white;
            text-align: left;
            height: 300px;
            position: relative;
        }
        .header h1 {
            position: absolute;
            top: 10px;
            left: 20px;
            margin: 0;
        }
        .header h2 {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            margin: 0;
        }
        .content {
            padding: 20px;
            background-color: #0F1E23;
            color: white;
        }
        .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #5E9687;
            color: black;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 16px;
        }
        .footer {
            padding: 20px;
            background-color: #0F1E23;
            color: white;
            text-align: center;
        }
        .social-media {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .social-media a {
            margin: 0 10px;
            color: white;
            font-size: 24px;
            text-decoration: none;
        }
        .social-media a:hover {
            color: #007bff;
            transform: scale(1.2);
        }
        .footer p {
            color: white;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>To-Do App</h1>
            <h2>Email Verification</h2>
        </div>
        <div class="content">
            <p>Hi there!</p>
            <p>Thank you for registering with our To-Do application. Please verify your email address by clicking the button below.</p>
            <a href="http://localhost:8000/verifytoken/${token}" class="button">Verify Email</a>
        </div>
        <div class="footer">
            <div class="social-media">
                <a href="https://x.com/HemanthHem81783" target="_blank"><i class="fa-brands fa-x-twitter"></i></a>
                <a href="https://www.instagram.com/hemanth_mon/" target="_blank"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://www.linkedin.com/in/hemanth-mon/" target="_blank"><i class="fa-brands fa-linkedin"></i></a>
            </div>
            <p>&copy; 2024 To-Do Application. All rights reserved.</p>
        </div>
    </div>
</body>`,
};
transporter.sendMail(mailOptions, function(error, info ){
    if(error){
        console.log("The error is occuring from email verification", error)
    }
    else{
        console.log(`Email has been sent succefully:${email}` + info.response);
    }
}); 

};
module.exports = { todoDataValidation, generateToken, sendVerificationMail };