const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const addBtn = $(".add-btn")
const addTaskModal = $(".modal-overlay")
const closeModal = $(".modal-close")
const cancelModal = $(".btn-cancel")
const taskTitle = $("#taskTitle")
const todoAppForm = $("#todo-app-form")
const todoList = $("#todoList")
const searchInput = $(".search-input")
const activeTask = $(".active-task")
const completeTask = $(".complete-task")
const allTask = $(".all-task")

let editID = null
const baseURLServer = "http://localhost:3000/tasks"

// Tìm kiếm dựa vào dữ liệu nhập: oninput
searchInput.addEventListener("input", async function (e) {
    const valueSearch = e.target.value.trim().toLowerCase()

    const data = await fetchData()

    const searchResults = data.filter((task) => {
        return (
            task.title.toLowerCase().includes(valueSearch) ||
            task.description.toLowerCase().includes(valueSearch)
        )
    })

    allTask.classList.add("active")
    activeTask.classList.remove("active")
    completeTask.classList.remove("active")
    renderTask(searchResults)
})

// Mờ form
function openForm() {
    addTaskModal.classList.add("show")

    // Tự động focus ô input đầu tiên
    setTimeout(() => {
        taskTitle.focus()
    }, 1000)
}

addBtn.addEventListener("click", openForm)

// Thoát form
function closeForm() {
    // Sử dụng toggle để bật tắt form
    addTaskModal.classList.toggle("show")

    const formTitle = addTaskModal.querySelector(".modal-title")
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original || formTitle.textContent
        delete formTitle.dataset.original
    }

    const submitBtn = addTaskModal.querySelector(".btn-submit")
    if (submitBtn) {
        submitBtn.textContent =
            submitBtn.dataset.original || submitBtn.textContent
        delete submitBtn.dataset.original
    }

    // Cuộn lên đầu form
    addTaskModal.querySelector(".modal").scrollTop = 0

    // reset form về giá trị mặc định
    todoAppForm.reset()

    editID = null
}

closeModal.addEventListener("click", closeForm)
cancelModal.addEventListener("click", closeForm)

// Lưu dữ liệu vào json server
async function saveTask(task) {
    await fetch(`${baseURLServer}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    })
}

// Thêm task vào json-server
async function addNewTask(task) {
    await fetch(`${baseURLServer}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    })
}

// edit task
async function editTask(task, taskID) {
    await fetch(`${baseURLServer}/${taskID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    })
}

async function deleteTask(taskID) {
    await fetch(`${baseURLServer}/${taskID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
}

async function completeTaskTick(currentTask, taskID) {
    await fetch(`${baseURLServer}/${taskID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(currentTask),
    })
}

todoAppForm.addEventListener("submit", async function (e) {
    e.preventDefault()

    // Lấy ra toàn bộ dữ liệu của form và lưu vào formData
    const formData = Object.fromEntries(new FormData(todoAppForm))
    formData.isComplete = false
    formData.createAt = new Date()

    // Nếu có index thực hiện mở modal sửa
    // Thực hiện logic sửa
    if (editID) {
        const currentTitle = taskTitle.value
        const data = await fetchData()

        // Kiểm tra xem task đó đã có trong json-server hay chưa
        const result = data.filter((task) => {
            return (
                currentTitle.toLowerCase() === task.title.toLowerCase() &&
                task.id !== editID
            )
        })
        if (result.length !== 0) {
            showErrorToast()
            return
        } else {
            // todoTask[editID] = formData
            await editTask(formData, editID)
        }

        // Thực hiện logic thêm phần tử vào mảng và render ra giao diện
    } else {
        // Mặc định là task chưa hoàn thành
        formData.isComplete = false

        const data = await fetchData()

        const result = data.filter((task) => {
            return (
                taskTitle.value === task.title.toLowerCase() &&
                task.id !== editID
            )
        })
        if (result.length !== 0) {
            showErrorToast()
            return
        }

        await addNewTask(formData)
    }

    showSuccessToastAddNew()
    // ẩn modal đi, khi ẩn sẽ reset form ở trong hàm closeForm
    closeForm()

    // renderTask(todoTask)
    await getData()
})

todoList.addEventListener("click", async function (e) {
    const editBtn = e.target.closest(".edit-btn")
    const deleteBtn = e.target.closest(".delete-btn")
    const completeBtn = e.target.closest(".complete-btn")

    // Bấm vào edit sẽ lấy các dữ liệu từ task đó và hiển thị lên các ô input
    if (editBtn) {
        const taskID = editBtn.dataset.index
        const res = await fetch(`${baseURLServer}/${taskID}`)
        const data = await res.json()

        editID = taskID
        // edit
        for (const key in data) {
            const value = data[key]
            const input = $(`[name="${key}"]`)
            if (input) {
                input.value = value
            }
        }
        const formTitle = addTaskModal.querySelector(".modal-title")
        formTitle.dataset.original = formTitle.textContent
        formTitle.textContent = "Edit Task"
        const submitBtn = addTaskModal.querySelector(".btn-submit")
        submitBtn.dataset.original = submitBtn.textContent
        submitBtn.textContent = "Save Task"
        openForm()
    }

    // Xóa task
    if (deleteBtn) {
        const taskIndex = deleteBtn.dataset.index

        await deleteTask(taskIndex)

        showSuccessToastDelete()
        // data.splice(taskIndex, 1)

        await getData()
    }

    // Đánh dấu hoàn thành
    if (completeBtn) {
        const taskID = completeBtn.dataset.index

        const res = await fetch(`${baseURLServer}/${taskID}`)
        const data = await res.json()

        data.isComplete = !data.isComplete

        await completeTaskTick(data, data.id)

        allTask.classList.add("active")
        activeTask.classList.remove("active")
        completeTask.classList.remove("active")

        const tasks = await fetchData()
        renderTask(tasks)
    }
})

// Phân loại task

allTask.addEventListener("click", async function (e) {
    const data = await fetchData()

    allTask.classList.add("active")
    activeTask.classList.remove("active")
    completeTask.classList.remove("active")

    renderTask(data)
})

activeTask.addEventListener("click", async function (e) {
    const data = await fetchData()

    const activeTasks = data.filter((task) => task.isComplete === false)

    allTask.classList.remove("active")
    activeTask.classList.add("active")
    completeTask.classList.remove("active")
    renderTask(activeTasks)
})

completeTask.addEventListener("click", async function (e) {
    const data = await fetchData()

    const completeTasks = data.filter((task) => task.isComplete === true)

    // Tô sáng tab hiện tại
    allTask.classList.remove("active")
    activeTask.classList.remove("active")
    completeTask.classList.add("active")
    renderTask(completeTasks)
})

async function fetchData() {
    const response = await fetch(`${baseURLServer}?_sort=-createAt`, {
        method: "GET",
    })
    if (!response.ok) {
        throw new Error("Không thể lấy danh sách tasks")
    } else {
        return await response.json()
    }
}

// Lấy data => render giao diện
async function getData() {
    try {
        const tasks = await fetchData()
        renderTask(tasks)
    } catch (error) {
        console.log(error)
    }
}

function renderTask(taskList) {
    const html = taskList
        .map(
            (task, index) =>
                `<div class="task-card ${escapeHTML(task.color)} ${
                    task.isComplete ? "completed" : ""
                }">
                <div class="task-header">
                    <h3 class="task-title">${escapeHTML(task.title)}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item edit-btn" data-index="${
                                task.id
                            }">
                                <i
                                    class="fa-solid fa-pen-to-square fa-icon" 
                                ></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete complete-btn" data-index=${
                                task.id
                            }>
                                <i class="fa-solid fa-check fa-icon"></i>
                                ${
                                    task.isComplete
                                        ? "Mark as Active"
                                        : "Mark as Complete"
                                }
                            </div>
                            <div class="dropdown-item delete delete-btn" data-index="${
                                task.id
                            }">
                                <i class="fa-solid fa-trash fa-icon"></i>
                                Delete
                            </div>
                        </div>
                    </button>
                </div>
                <p class="task-description">
                    ${escapeHTML(task.description)}
                </p>
                <div class="task-time">${escapeHTML(
                    task.startTime
                )} - ${escapeHTML(task.endTime)} PM</div>
            </div>`
        )
        .join("")
    todoList.innerHTML = html
}

function escapeHTML(html) {
    const div = document.createElement("div")
    div.textContent = html
    return div.innerHTML
}

getData()

// Toast Message

function toast({ title = "", message = "", type = "info", duration = 3000 }) {
    const toastElement = document.querySelector("#toast")
    if (toastElement) {
        const toast = document.createElement("div")

        // Auto remove toast
        const autoRemoveId = setTimeout(function () {
            toastElement.removeChild(toast)
        }, duration + 1000)

        // Remove toast when clicked
        toast.onclick = function (e) {
            if (e.target.closest(".toast__close")) {
                toastElement.removeChild(toast)
                clearTimeout(autoRemoveId)
            }
        }

        const icons = {
            success: "fas fa-check-circle",
            info: "fas fa-info-circle",
            warning: "fas fa-exclamation-circle",
            error: "fas fa-exclamation-circle",
        }
        const icon = icons[type]
        const delay = (duration / 1000).toFixed(2)

        toast.classList.add("toast", `toast--${type}`)
        toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`

        toast.innerHTML = `
                    <div class="toast__icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="toast__body">
                        <h3 class="toast__title">${title}</h3>
                        <p class="toast__msg">${message}</p>
                    </div>
                    <div class="toast__close">
                        <i class="fas fa-times"></i>
                    </div>
                `
        toastElement.appendChild(toast)
    }
}

// Hàm show success và Error
function showSuccessToastEdit() {
    toast({
        title: "Sửa một công việc",
        message: "Bạn đã sửa thành công một công việc.",
        type: "success",
        duration: 5000,
    })
}

function showErrorToast() {
    toast({
        title: "Trùng công việc",
        message: "Công việc này đã có trong danh sách.",
        type: "error",
        duration: 5000,
    })
}

function showSuccessToastAddNew() {
    toast({
        title: "Thêm công việc mới",
        message: "Đã thêm một công việc vào danh sách.",
        type: "success",
        duration: 5000,
    })
}

function showSuccessToastDelete() {
    toast({
        title: "Xóa một công việc",
        message: "Đã xóa một công việc khỏi danh sách.",
        type: "success",
        duration: 5000,
    })
}
