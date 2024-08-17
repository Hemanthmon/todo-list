let skip = 0;

window.onload = generateTodos;

function toggle(){
    document.getElementById('darkmode')
    onclick.toggle('click', darkmode);

}

function generateTodos() {
    axios
    .get(`/read-item?skip=${skip}`)
    .then((res) => {
        console.log(res);
        if (res.status !== 200) {
            alert(res.data.message);
            return;
        }
        //the good things ahead
        console.log(skip);
        const todos = res.data.data;
        skip += todos.length;
        console.log(skip);
        document.getElementById("item_list").insertAdjacentHTML(
            "beforeend",
            todos
            .map((item) => {
                return `<li>
                    <span class="item-text">${item.todo}</span>
                    <div>
                        <button data-id="${item._id}" class="edit-me">Edit</button>
                        <button data-id="${item._id}" class="delete-me delete">Delete</button>
                    </div>
                </li>`;
            })
            .join('')
        );
    })
    .catch((err) => {
        console.log("Error in generating todos", err);
    });
}

document.addEventListener("click", function (event) {
    // Editing
    if(event.target.classList.contains("edit-me")){
        const newData = prompt("Enter new To-do");
        const todoId = event.target.getAttribute("data-id");
        console.log(newData, todoId);

        axios
        .post("/edit-item", { newData, todoId })
        .then((res) => {
            if(res.status !== 200){
                alert(res.data.message);
                return;
            }
            // Reflect changes in the UI
            event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newData;
        })
        .catch((err) => console.log(err));
    }
    // Deleting
    else if(event.target.classList.contains("delete-me")){
        const todoId = event.target.getAttribute("data-id");

        axios
        .post("/delete-item", { todoId })
        .then((res) => {
            if(res.status !== 200){
                alert(res.data.message);
                return;
            }
            event.target.parentElement.parentElement.remove();
        })
        .catch((err) => console.log(err));
    }
    // Creating the todo
    else if (event.target.classList.contains("add_item")){
        const todo = document.getElementById("create_field").value;
        console.log("Sending create-item request with todo:", todo);
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
                <span class="item-text">${todo}</span>
                <div>
                <button data-id="${todoId}" class="edit-me">Edit</button>
                <button data-id="${todoId}" class="delete-me delete">Delete</button>
                </div>
                </li>`
            );
        })
        .catch((err) => {
            console.log("Error in create-item request", err.response);
            if (err.response.status !== 500){
                alert(err.response.data);
            }
        });
    }
    //show more
    else if(event.target.classList.contains("show_more")){
        generateTodos();
    }
});
