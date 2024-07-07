window.onload = generateTodos;

function generateTodos() {
    axios.get('/read-item')
    .then((res) => {
        if (res.data.status != 200) {
            alert(res.data.message);
            return;
        }
        const todos = res.data.data;

        document.getElementById("item_list").innerHTML = todos
            .map((item) => {
                return `<li>
                    <span class="item-text"> ${item.todo}</span>
                    <div>
                        <button data-id="${item._id}" class="edit-me">Edit</button>
                        <button data-id="${item._id}" class="delete-me delete">Delete</button>
                    </div>
                </li>`;
            }).join('') 
    })
    .catch((err) => {
        console.log("getting trouble in generating todo", err);
    });
}

document.addEventListener("click", function (event) {
   //editing
   if(event.target.classList.contains("edit-me")){
      const newData = prompt("Enter new To-do");
      const todoId = event.target.getAttribute("data-id");
      console.log(newData, todoId);

      axios
      .post("/edit-item", { newData, todoId})
      .then((res) => {
         if(res.data.status != 200){
            alert(res.data.message);
            return;
         }
         //to reflect in ui
       event.target.parentElement.parentElement.querySelector(
         ".item-text"
       ).innerHTML = newData;
      })
      .catch((err) => console.log(err));
   }
   //delete
   else if(event.target.classList.contains("delete-me")){
      const todoId = event.target.getAttribute("data-id");

      axios
      .post("/delete-item", { todoId })
      .then((res) => {
         if(res.data.status !== 200){
            alert(res.data.message);
            return;
         }
         event.target.parentElement.parentElement.remove();
      })
      .catch((err) => console.log(err));
   }
   //creating the todo
   document.addEventListener("click", function (event) {
   if (event.target.classList.contains("add_item")){
      const todo = this.getElementById("create_field").value; // chabges removed this
      console.log("sending create-item request with todo:", todo);
      axios
      .post("/create-item", { todo })
      .then((res) => {
         console.log("create-item response:", res);
         document.getElementById("create_field").value = "";
         const todo = res.data.data.todo;
         const todoId = res.data.data._id;
         document
         .getElementById("item_list")
         .insertAdjacentHTML("beforeend",
            `<li>
            <span class="item-text"> ${todo}</span>
            <div>
            <button data-id="${todoId}" class="edit-me">Edit</button>
            <button data-id="${todoId}" class="delete-me delete">Delete</button>
            </div>
            </li>`
         );
      })
      .catch((err) => {
         console.log("Error in creat-item request", err.response);
         if (err.response !== 500){
            alert(err.response.data);
         }
      });

   }
});
});