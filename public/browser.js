let skip = 0;

window.onload = generateTodos;

function generateTodos() {
    axios
        .get(`/read-item?skip=${skip}`)
        .then((res) => {
            console.log("Response from /read-item:", res);
            if (res.status !== 200) {
                alert(res.data.message || "Please Enter Todo");
                return;
            }

            // Handle case when there are no todos
            if (!res.data.data || res.data.data.length === 0) {
                alert("No todos found");
                return;
            }

            const todos = res.data.data;
            skip += todos.length;

            const todoHtml = todos.map((item) => {
                return `<li>
                    <span class="item-text">${item.todo}</span>
                    <div>
                        <button data-id="${item._id}" class="edit-me">Edit</button>
                        <button data-id="${item._id}" class="delete-me delete">Delete</button>
                    </div>
                </li>`;
            }).join('');

            document.getElementById("item_list").insertAdjacentHTML("beforeend", todoHtml);
        })
        .catch((err) => {
            console.log("Error in generating todos:", err);
            alert("Failed to load todos");
        });
}

document.addEventListener("click", function (event) {
    // Editing
    if (event.target.classList.contains("edit-me")) {
        const newData = prompt("Enter new To-do");
        const todoId = event.target.getAttribute("data-id");
        console.log("Edit request:", newData, todoId);

        if (newData) {
            axios
                .post("/edit-item", { newData, todoId })
                .then((res) => {
                    if (res.status !== 200) {
                        alert(res.data.message);
                        return;
                    }
                    // Reflect changes in the UI
                    event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newData;
                })
                .catch((err) => console.log("Edit error:", err));
        } else {
            alert("To-do content cannot be empty.");
        }
    }
    // Deleting
    else if (event.target.classList.contains("delete-me")) {
        const todoId = event.target.getAttribute("data-id");
        console.log("Delete request:", todoId);

        axios
            .post("/delete-item", { todoId })
            .then((res) => {
                if (res.status !== 200) {
                    alert(res.data.message);
                    return;
                }
                event.target.parentElement.parentElement.remove();
            })
            .catch((err) => console.log("Delete error:", err));
    }
    // Creating the todo
    else if (event.target.classList.contains("add_item")) {
        const todo = document.getElementById("create_field").value;
        console.log("Create request:", todo);

        if (todo) {
            axios
                .post("/create-item", { todo })
                .then((res) => {
                    console.log("Create response:", res);
                    document.getElementById("create_field").value = "";
                    const todo = res.data.data.todo;
                    const todoId = res.data.data._id;
                    document.getElementById("item_list").insertAdjacentHTML(
                        "beforeend",
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
                    console.log("Error in create-item request:", err);
                    alert(err.response?.data || "Failed to create todo");
                });
        } else {
            alert("To-do content cannot be empty.");
        }
    }
    // Show more
    else if (event.target.classList.contains("show_more")) {
        generateTodos();
    }
});
