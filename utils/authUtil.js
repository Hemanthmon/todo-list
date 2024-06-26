const isEmailRegex = ({ key }) => {
    const isEmail =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
        key
      );
    return isEmail;
  };
  
  const userDataValidation = ({ name, email, username, password }) => {
    return new Promise((resolve, reject) => {
      console.log(name, email, username, password);
  
      if (!name || !email || !username || !password) {
        return reject("Missing user credentials");
      }
  
      if (typeof name !== 'string') {
        return reject("Please enter a valid name");
      }
      if (typeof email !== 'string') {
        return reject("Please enter a valid email");
      }
      if (typeof username !== 'string') {
        return reject("Please enter a valid username");
      }
      if (typeof password !== 'string') {
        return reject("Please enter a valid password");
      }
  
      if (username.length < 3 || username.length > 40) {
        return reject("Username should not be less than 3 characters and should not be more than 40 characters");
      }
  
      if (!isEmailRegex({ key: email })) {
        return reject("Email format is incorrect");
      }
  
      resolve();
    });
  };
  
  module.exports = { userDataValidation, isEmailRegex };
  