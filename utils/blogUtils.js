const todoDataValidation = ({ todo }) => {
    return new Promise((resolve, reject) => {
        if(!todo) reject("Todo is missing");
        if (typeof todo !== "string") reject("Todo is not a text");
        if (todo.length < 3 || todo.lenght > 100)
            reject("Todo lenght should be 3-100 characters only");

        resolve();
    });
}
module.exports = todoDataValidation;