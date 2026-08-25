/* =========================================================
   ACEARCH
   Complete Application JavaScript
   Version 2
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEYS = {
    tasks: "acearch_tasks",
    calendar: "acearch_calendar",
    subjects: "acearch_subjects",
    focus: "acearch_focus",
    notifications: "acearch_notifications",
    settings: "acearch_settings"
};


const defaultSettings = {
    theme: "dark",
    accent: "#7c5cff",
    font: "Inter",
    density: "comfortable",

    taskNotifications: true,
    deadlineNotifications: true,
    studyNotifications: true,

    confirmDelete: true,
    autoCalendarTasks: true
};


function loadStorage(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;

    } catch (error) {

        console.warn(
            `Could not load ${key}:`,
            error
        );

        return fallback;

    }

}


let tasks =
    loadStorage(STORAGE_KEYS.tasks, []);

let calendarItems =
    loadStorage(STORAGE_KEYS.calendar, []);

let subjects =
    loadStorage(STORAGE_KEYS.subjects, []);

let focusSessions =
    loadStorage(STORAGE_KEYS.focus, []);

let notifications =
    loadStorage(
        STORAGE_KEYS.notifications,
        []
    );

let settings = {
    ...defaultSettings,
    ...loadStorage(
        STORAGE_KEYS.settings,
        {}
    )
};


/* =========================================================
   SAVE
========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEYS.tasks,
        JSON.stringify(tasks)
    );

    localStorage.setItem(
        STORAGE_KEYS.calendar,
        JSON.stringify(calendarItems)
    );

    localStorage.setItem(
        STORAGE_KEYS.subjects,
        JSON.stringify(subjects)
    );

    localStorage.setItem(
        STORAGE_KEYS.focus,
        JSON.stringify(focusSessions)
    );

    localStorage.setItem(
        STORAGE_KEYS.notifications,
        JSON.stringify(notifications)
    );

    localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(settings)
    );

}


/* =========================================================
   HELPERS
========================================================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function todayString() {

    const date = new Date();

    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    const options = {
        month: "short",
        day: "numeric",
        year: "numeric"
    };

    return date.toLocaleDateString(
        undefined,
        options
    );

}


function formatFullDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


function formatMinutes(minutes) {

    minutes =
        Number(minutes) || 0;

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    return remaining
        ? `${hours}h ${remaining}m`
        : `${hours}h`;

}


function dateToString(date) {

    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


function getDateFromString(value) {

    return new Date(
        `${value}T00:00:00`
    );

}


function isPastDate(value) {

    return value < todayString();

}


function showToast(message, type = "info") {

    let container =
        document.querySelector(
            "#acearchToastContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "acearchToastContainer";

        container.style.cssText = `
            position:fixed;
            right:20px;
            bottom:20px;
            z-index:99999;
            display:flex;
            flex-direction:column;
            gap:10px;
            pointer-events:none;
        `;

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.textContent = message;

    toast.style.cssText = `
        padding:12px 16px;
        border-radius:12px;
        background:var(--card,#18181f);
        color:var(--text,#fff);
        border:1px solid var(--border,#2a2a35);
        box-shadow:0 10px 30px rgba(0,0,0,.25);
        font-size:14px;
        max-width:320px;
        pointer-events:auto;
        transition:opacity .25s ease;
    `;

    if (type === "error") {
        toast.style.borderColor = "#ef4444";
    }

    if (type === "success") {
        toast.style.borderColor = "#22c55e";
    }

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 2800);

}


let confirmationResolver = null;

function confirmAction(message) {
    if (!settings.confirmDelete) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        const overlay = document.querySelector("#confirmationModal");
        const messageElement = document.querySelector("#confirmationMessage");

        if (!overlay || !messageElement) {
            resolve(true);
            return;
        }

        confirmationResolver = resolve;
        messageElement.textContent = message;
        openModal("#confirmationModal");
    });
}

function closeConfirmation(result) {
    if (confirmationResolver) {
        const resolve = confirmationResolver;
        confirmationResolver = null;
        resolve(result);
    }

    closeModal("#confirmationModal");
}

document.querySelector("#confirmationConfirm")?.addEventListener("click", () => {
    closeConfirmation(true);
});

document.querySelector("#confirmationCancel")?.addEventListener("click", () => {
    closeConfirmation(false);
});


/* =========================================================
   DISABLE RIGHT CLICK
========================================================= */

document.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);


/* =========================================================
   NAVIGATION
========================================================= */

const sections = {

    dashboard:
        document.querySelector(
            "#dashboardSection"
        ),

    tasks:
        document.querySelector(
            "#tasksSection"
        ),

    calendar:
        document.querySelector(
            "#calendarSection"
        ),

    subjects:
        document.querySelector(
            "#subjectsSection"
        ),

    focus:
        document.querySelector(
            "#focusSection"
        ),

    analytics:
        document.querySelector(
            "#analyticsSection"
        ),

    settings:
        document.querySelector(
            "#settingsSection"
        )

};


const pageTitles = {

    dashboard: "Dashboard",
    tasks: "Tasks",
    calendar: "Calendar",
    subjects: "Subjects",
    focus: "Focus",
    analytics: "Analytics",
    settings: "Settings"

};


function navigate(section) {

    if (!sections[section]) {
        return;
    }

    Object.values(sections)
        .forEach(element => {

            element?.classList.remove(
                "active-section"
            );

        });


    sections[section]
        .classList.add(
            "active-section"
        );


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.section === section
            );

        });


    const title =
        document.querySelector(
            "#pageTitle"
        );

    if (title) {

        title.textContent =
            pageTitles[section] ||
            "AceArch";

    }


    closeSidebar();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    switch (section) {

        case "dashboard":
            renderDashboard();
            break;

        case "tasks":
            renderTasks();
            break;

        case "calendar":
            renderCalendar();
            break;

        case "subjects":
            renderSubjects();
            break;

        case "focus":
            renderFocusPage();
            break;

        case "analytics":
            renderAnalytics();
            break;

        case "settings":
            loadSettingsUI();
            break;

    }

}


document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.preventDefault();

                navigate(
                    item.dataset.section
                );

            }
        );

    });


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const sidebar =
    document.querySelector(
        "#sidebar"
    );

const sidebarOverlay =
    document.querySelector(
        "#sidebarOverlay"
    );


function openSidebar() {

    sidebar?.classList.add(
        "open"
    );

    sidebarOverlay?.classList.add(
        "show"
    );

}


function closeSidebar() {

    sidebar?.classList.remove(
        "open"
    );

    sidebarOverlay?.classList.remove(
        "show"
    );

}


document
    .querySelector(
        "#menuButton"
    )
    ?.addEventListener(
        "click",
        openSidebar
    );


sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const element =
        document.querySelector(
            "#currentDate"
        );

    if (!element) {
        return;
    }

    element.textContent =
        new Date().toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}


updateCurrentDate();


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    const modal =
        document.querySelector(id);

    if (!modal) {
        return;
    }

    modal.classList.add(
        "show"
    );

}


function closeModal(id) {

    const modal =
        document.querySelector(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "show"
    );

}


document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => closeModal(
                "#taskModal"
            )
        );

    });


document
    .querySelectorAll(
        "[data-close-calendar]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => closeModal(
                "#calendarModal"
            )
        );

    });


document
    .querySelectorAll(
        "[data-close-subject]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => closeModal(
                "#subjectModal"
            )
        );

    });


document
    .querySelectorAll(
        ".modal-overlay"
    )
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    overlay.classList.remove(
                        "show"
                    );

                }

            }
        );

    });


/* =========================================================
   ACTION BUTTONS
========================================================= */

document
    .querySelectorAll(
        "[data-action]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.action;

                switch (action) {

                    case "add-task":
                        prepareTaskModal();
                        openModal(
                            "#taskModal"
                        );
                        break;

                    case "focus":
                        navigate("focus");
                        break;

                    case "calendar":
                        navigate("calendar");
                        break;

                    case "subject":
                        prepareSubjectModal();
                        openModal(
                            "#subjectModal"
                        );
                        break;

                    case "subjects":
                        navigate("subjects");
                        break;

                }

            }
        );

    });


document
    .querySelector(
        "#dashboardAddTask"
    )
    ?.addEventListener(
        "click",
        () => {

            prepareTaskModal();

            openModal(
                "#taskModal"
            );

        }
    );


document
    .querySelector(
        "#tasksAddButton"
    )
    ?.addEventListener(
        "click",
        () => {

            prepareTaskModal();

            openModal(
                "#taskModal"
            );

        }
    );


/* =========================================================
   TASK MODAL
========================================================= */

let editingTaskId = null;


function prepareTaskModal() {

    editingTaskId = null;

    const form =
        document.querySelector(
            "#taskForm"
        );

    if (!form) {
        return;
    }

    form.reset();

    const date =
        document.querySelector(
            "#taskDate"
        );

    if (date) {

        date.min =
            todayString();

    }

    const heading =
        form.closest(".modal")
            ?.querySelector("h2");

    if (heading) {
        heading.textContent =
            "Add Task";
    }

    const submit =
        form.querySelector(
            "[type='submit']"
        );

    if (submit) {
        submit.textContent =
            "Create Task";
    }

}


function editTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    editingTaskId =
        taskId;

    const title =
        document.querySelector(
            "#taskTitle"
        );

    const subject =
        document.querySelector(
            "#taskSubject"
        );

    const date =
        document.querySelector(
            "#taskDate"
        );

    const priority =
        document.querySelector(
            "#taskPriority"
        );

    const description =
        document.querySelector(
            "#taskDescription"
        );


    if (title) {
        title.value =
            task.title || "";
    }

    if (subject) {
        subject.value =
            task.subject || "";
    }

    if (date) {

        date.value =
            task.deadline || "";

        date.min =
            todayString();

    }

    if (priority) {
        priority.value =
            task.priority || "medium";
    }

    if (description) {
        description.value =
            task.description || "";
    }


    const heading =
        document.querySelector(
            "#taskModal h2"
        );

    if (heading) {
        heading.textContent =
            "Edit Task";
    }


    const submit =
        document.querySelector(
            "#taskForm [type='submit']"
        );

    if (submit) {
        submit.textContent =
            "Save Changes";
    }


    openModal(
        "#taskModal"
    );

}


async function deleteTask(taskId) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    if (!(await confirmAction(`Delete "${task.title}"?`))) {
        return;
    }

    tasks =
        tasks.filter(
            item => item.id !== taskId
        );


    calendarItems =
        calendarItems.filter(
            item =>
                item.taskId !== taskId
        );


    saveData();

    renderAll();

    showToast(
        "Task deleted.",
        "success"
    );

}


function toggleTask(taskId, completed) {

    const task =
        tasks.find(
            item => item.id === taskId
        );

    if (!task) {
        return;
    }

    task.completed =
        completed;

    task.completedAt =
        completed
            ? new Date().toISOString()
            : null;

    saveData();

    renderAll();

}


/* =========================================================
   TASK FORM
========================================================= */

document
    .querySelector(
        "#taskForm"
    )
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const title =
                document
                    .querySelector(
                        "#taskTitle"
                    )
                    ?.value
                    .trim();


            const subject =
                document
                    .querySelector(
                        "#taskSubject"
                    )
                    ?.value
                    .trim();


            const deadline =
                document
                    .querySelector(
                        "#taskDate"
                    )
                    ?.value;


            const priority =
                document
                    .querySelector(
                        "#taskPriority"
                    )
                    ?.value ||
                "medium";


            const description =
                document
                    .querySelector(
                        "#taskDescription"
                    )
                    ?.value
                    .trim();


            if (!title || !deadline) {

                showToast(
                    "Please enter a title and deadline.",
                    "error"
                );

                return;

            }


            /* NEVER allow a deadline before today */

            if (
                deadline <
                todayString()
            ) {

                showToast(
                    "Task deadlines cannot be before today.",
                    "error"
                );

                return;

            }


            /* EDIT EXISTING TASK */

            if (editingTaskId) {

                const task =
                    tasks.find(
                        item =>
                            item.id ===
                            editingTaskId
                    );

                if (!task) {
                    return;
                }

                const oldDeadline =
                    task.deadline;

                task.title =
                    title;

                task.subject =
                    subject;

                task.deadline =
                    deadline;

                task.priority =
                    priority;

                task.description =
                    description;

                task.updatedAt =
                    new Date().toISOString();


                if (
                    oldDeadline !==
                    deadline
                ) {

                    const calendarItem =
                        calendarItems.find(
                            item =>
                                item.taskId ===
                                task.id
                        );

                    if (calendarItem) {

                        calendarItem.date =
                            deadline;

                    }

                }


                saveData();

                event.target.reset();

                closeModal(
                    "#taskModal"
                );

                editingTaskId =
                    null;

                renderAll();

                showToast(
                    "Task updated.",
                    "success"
                );

                return;

            }


            /* CREATE NEW TASK */

            const task = {

                id: createId(),

                title,

                subject,

                deadline,

                priority,

                description,

                completed: false,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    null,

                completedAt:
                    null

            };


            tasks.push(task);


            if (
                settings.autoCalendarTasks
            ) {

                calendarItems.push({

                    id: createId(),

                    title,

                    date: deadline,

                    type: "task",

                    taskId: task.id

                });

            }


            if (
                settings.taskNotifications
            ) {

                notifications.push({

                    id: createId(),

                    title:
                        "New task created",

                    message:
                        `${title} is due ${formatDate(deadline)}.`,

                    createdAt:
                        new Date().toISOString(),

                    read: false

                });

            }


            saveData();


            event.target.reset();

            closeModal(
                "#taskModal"
            );

            renderAll();

            navigate("tasks");

            showToast(
                "Task created.",
                "success"
            );

        }
    );


/* =========================================================
   TASK RENDERING
========================================================= */

function taskHTML(task) {

    const overdue =
        !task.completed &&
        task.deadline <
        todayString();

    return `

        <div
            class="task ${task.completed ? "completed" : ""}"
            data-task-id="${escapeHTML(task.id)}">

            <input
                type="checkbox"
                data-task-check="${escapeHTML(task.id)}"
                ${task.completed ? "checked" : ""}
                aria-label="Complete task"
            >

            <div class="task-content">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-meta">

                    ${escapeHTML(
                        task.subject ||
                        "No subject"
                    )}

                    · Due ${escapeHTML(
                        formatDate(task.deadline)
                    )}

                    · ${escapeHTML(
                        task.priority
                    )}

                    ${
                        overdue
                            ? ` · <strong>Overdue</strong>`
                            : ""
                    }

                </div>

            </div>

            <div class="task-actions">

                <button
                    type="button"
                    class="task-edit"
                    data-task-edit="${escapeHTML(task.id)}"
                    title="Edit task">
                    ✎
                </button>

                <button
                    type="button"
                    class="task-delete"
                    data-task-delete="${escapeHTML(task.id)}"
                    title="Delete task">
                    ×
                </button>

            </div>

        </div>

    `;

}


function renderTasks() {

    const list =
        document.querySelector(
            "#fullTaskList"
        );

    const empty =
        document.querySelector(
            "#tasksEmpty"
        );


    if (!list) {
        return;
    }


    const search =
        document
            .querySelector(
                "#taskSearch"
            )
            ?.value
            .toLowerCase()
            .trim() ||
        "";


    const filter =
        document
            .querySelector(
                "#taskFilter"
            )
            ?.value ||
        "all";


    const priorityFilter =
        document
            .querySelector(
                "#taskPriorityFilter"
            )
            ?.value ||
        "all";


    const today =
        todayString();


    const filtered =
        tasks.filter(task => {

            const title =
                (
                    task.title ||
                    ""
                ).toLowerCase();

            const subject =
                (
                    task.subject ||
                    ""
                ).toLowerCase();

            const description =
                (
                    task.description ||
                    ""
                ).toLowerCase();


            const matchesSearch =
                title.includes(search) ||
                subject.includes(search) ||
                description.includes(search);


            const matchesFilter =
                filter === "all" ||

                (
                    filter === "active" &&
                    !task.completed
                ) ||

                (
                    filter === "completed" &&
                    task.completed
                ) ||

                (
                    filter === "overdue" &&
                    !task.completed &&
                    task.deadline < today
                );


            const matchesPriority =
                priorityFilter === "all" ||
                task.priority ===
                priorityFilter;


            return (
                matchesSearch &&
                matchesFilter &&
                matchesPriority
            );

        });


    list.innerHTML =
        filtered
            .map(taskHTML)
            .join("");


    if (empty) {

        empty.style.display =
            filtered.length === 0
                ? "flex"
                : "none";

    }


    updateStats();

}


document
    .querySelector(
        "#taskSearch"
    )
    ?.addEventListener(
        "input",
        renderTasks
    );


document
    .querySelector(
        "#taskFilter"
    )
    ?.addEventListener(
        "change",
        renderTasks
    );


document
    .querySelector(
        "#taskPriorityFilter"
    )
    ?.addEventListener(
        "change",
        renderTasks
    );


document.addEventListener(
    "change",
    event => {

        const checkbox =
            event.target.closest(
                "[data-task-check]"
            );

        if (!checkbox) {
            return;
        }

        toggleTask(
            checkbox.dataset.taskCheck,
            checkbox.checked
        );

    }
);


document.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                "[data-task-edit]"
            );

        if (editButton) {

            editTask(
                editButton.dataset.taskEdit
            );

            return;

        }


        const deleteButton =
            event.target.closest(
                "[data-task-delete]"
            );

        if (deleteButton) {

            deleteTask(
                deleteButton.dataset.taskDelete
            );

        }

    }
);


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const today =
        todayString();


    const todayTasks =
        tasks.filter(
            task =>
                task.deadline === today
        );


    const taskList =
        document.querySelector(
            "#dashboardTaskList"
        );


    const taskEmpty =
        document.querySelector(
            "#dashboardTaskEmpty"
        );


    if (taskList) {

        taskList.innerHTML =
            todayTasks
                .map(taskHTML)
                .join("");

    }


    if (taskEmpty) {

        taskEmpty.style.display =
            todayTasks.length
                ? "none"
                : "block";

    }


    const upcoming =
        [...calendarItems]
            .filter(
                item =>
                    item.date >= today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            )
            .slice(0, 5);


    const upcomingList =
        document.querySelector(
            "#dashboardUpcoming"
        );


    const upcomingEmpty =
        document.querySelector(
            "#dashboardUpcomingEmpty"
        );


    if (upcomingList) {

        upcomingList.innerHTML =
            upcoming
                .map(item => `

                    <div class="calendar-item">

                        <strong>
                            ${escapeHTML(
                                item.title
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                formatDate(
                                    item.date
                                )
                            )}
                            ·
                            ${escapeHTML(
                                item.type
                            )}
                        </small>

                    </div>

                `)
                .join("");

    }


    if (upcomingEmpty) {

        upcomingEmpty.style.display =
            upcoming.length
                ? "none"
                : "block";

    }


    renderDashboardSubjects();

    renderWeeklyBars();

    updateStats();

}


function renderDashboardSubjects() {

    const container =
        document.querySelector(
            "#dashboardSubjects"
        );

    const empty =
        document.querySelector(
            "#dashboardSubjectsEmpty"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        subjects
            .slice(0, 5)
            .map(subject => {

                const count =
                    tasks.filter(
                        task =>
                            task.subject ===
                            subject.name
                    ).length;

                return `

                    <div class="task">

                        <span
                            class="subject-color"
                            style="background:${escapeHTML(subject.color)}">
                        </span>

                        <div class="task-content">

                            <div class="task-title">
                                ${escapeHTML(
                                    subject.name
                                )}
                            </div>

                            <div class="task-meta">
                                ${count}
                                ${count === 1 ? "task" : "tasks"}
                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");


    if (empty) {

        empty.style.display =
            subjects.length
                ? "none"
                : "block";

    }

}


/* =========================================================
   STATS
========================================================= */

function calculateStudyStreak() {

    const completedDates =
        new Set(
            tasks
                .filter(
                    task =>
                        task.completed
                )
                .map(task => {

                    if (
                        task.completedAt
                    ) {

                        return task.completedAt
                            .slice(0, 10);

                    }

                    return task.createdAt
                        ?.slice(0, 10);

                })
                .filter(Boolean)
        );


    let streak = 0;

    const date =
        new Date();


    while (true) {

        const value =
            dateToString(date);

        if (
            !completedDates.has(value)
        ) {
            break;
        }

        streak++;

        date.setDate(
            date.getDate() - 1
        );

    }


    return streak;

}


function updateStats() {

    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const totalMinutes =
        focusSessions.reduce(
            (sum, session) =>
                sum +
                (
                    Number(
                        session.minutes
                    ) || 0
                ),
            0
        );


    const completion =
        tasks.length
            ? Math.round(
                (
                    completed /
                    tasks.length
                ) * 100
            )
            : 0;


    const streak =
        calculateStudyStreak();


    const completedElement =
        document.querySelector(
            "#completedTasksStat"
        );

    if (completedElement) {
        completedElement.textContent =
            completed;
    }


    const streakElement =
        document.querySelector(
            "#studyStreakStat"
        );

    if (streakElement) {
        streakElement.textContent =
            streak;
    }


    const studyTimeElement =
        document.querySelector(
            "#studyTimeStat"
        );

    if (studyTimeElement) {

        studyTimeElement.textContent =
            formatMinutes(
                totalMinutes
            );

    }


    const productivityElement =
        document.querySelector(
            "#productivityStat"
        );

    if (productivityElement) {

        productivityElement.textContent =
            `${completion}%`;

    }


    const analyticsTasks =
        document.querySelector(
            "#analyticsTasks"
        );

    if (analyticsTasks) {
        analyticsTasks.textContent =
            completed;
    }


    const analyticsFocus =
        document.querySelector(
            "#analyticsFocus"
        );

    if (analyticsFocus) {

        analyticsFocus.textContent =
            `${totalMinutes}m`;

    }


    const analyticsSubjects =
        document.querySelector(
            "#analyticsSubjects"
        );

    if (analyticsSubjects) {

        analyticsSubjects.textContent =
            subjects.length;

    }


    const analyticsCompletion =
        document.querySelector(
            "#analyticsCompletion"
        );

    if (analyticsCompletion) {

        analyticsCompletion.textContent =
            `${completion}%`;

    }

}


/* =========================================================
   CALENDAR
========================================================= */

let calendarDate =
    new Date();

let selectedCalendarDate =
    todayString();


function renderCalendar() {

    const grid =
        document.querySelector(
            "#calendarGrid"
        );

    const title =
        document.querySelector(
            "#calendarMonth"
        );


    if (!grid || !title) {
        return;
    }


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    title.textContent =
        calendarDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();
    // AceArch uses Monday as the fixed calendar start.
    let startingDay = firstDay.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;


    grid.innerHTML = "";


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        const previousDate =
            new Date(
                year,
                month,
                -startingDay + i + 1
            );

        grid.appendChild(
            createCalendarDay(
                previousDate,
                true
            )
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        grid.appendChild(
            createCalendarDay(
                date,
                false
            )
        );

    }


    while (
        grid.children.length < 42
    ) {

        const nextDay =
            grid.children.length -
            startingDay -
            daysInMonth +
            1;

        const nextDate =
            new Date(
                year,
                month,
                daysInMonth + nextDay
            );

        grid.appendChild(
            createCalendarDay(
                nextDate,
                true
            )
        );

    }


    renderSelectedDate();

}


function createCalendarDay(
    date,
    muted
) {

    const button =
        document.createElement(
            "button"
        );


    const dateString =
        dateToString(date);


    button.type =
        "button";

    button.className =
        "calendar-day";


    if (muted) {
        button.classList.add(
            "muted"
        );
    }


    if (
        dateString ===
        todayString()
    ) {

        button.classList.add(
            "today"
        );

    }


    if (
        dateString ===
        selectedCalendarDate
    ) {

        button.classList.add(
            "selected"
        );

    }


    const items =
        calendarItems.filter(
            item =>
                item.date ===
                dateString
        );


    button.innerHTML = `

        <span class="day-number">
            ${date.getDate()}
        </span>

        ${
            items.length
                ? `<span class="day-dot"></span>`
                : ""
        }

    `;


    button.addEventListener(
        "click",
        () => {

            selectedCalendarDate =
                dateString;

            renderCalendar();

        }
    );


    return button;

}


document
    .querySelector(
        "#previousMonth"
    )
    ?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();

        }
    );


document
    .querySelector(
        "#nextMonth"
    )
    ?.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();

        }
    );


function renderSelectedDate() {

    const title =
        document.querySelector(
            "#selectedDateTitle"
        );

    const container =
        document.querySelector(
            "#selectedDateItems"
        );


    if (!title || !container) {
        return;
    }


    title.textContent =
        formatFullDate(
            selectedCalendarDate
        );


    const items =
        calendarItems.filter(
            item =>
                item.date ===
                selectedCalendarDate
        );


    container.innerHTML =
        items.length

            ? items.map(item => `

                <div class="calendar-item">

                    <strong>
                        ${escapeHTML(
                            item.title
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            item.type
                        )}

                        ${
                            item.taskId
                                ? " · Task"
                                : ""
                        }
                    </small>

                </div>

            `).join("")

            : `

                <div class="empty-state">

                    <div class="empty-icon">
                        □
                    </div>

                    <h3>
                        Nothing planned
                    </h3>

                    <p>
                        Add a reminder, event or task.
                    </p>

                </div>

            `;

}


document
    .querySelector(
        "#addCalendarItem"
    )
    ?.addEventListener(
        "click",
        () => {

            const dateInput =
                document.querySelector(
                    "#calendarItemDate"
                );

            if (dateInput) {

                dateInput.value =
                    selectedCalendarDate;

                dateInput.min =
                    todayString();

            }

            openModal(
                "#calendarModal"
            );

        }
    );


document
    .querySelector(
        "#addSelectedDateItem"
    )
    ?.addEventListener(
        "click",
        () => {

            const dateInput =
                document.querySelector(
                    "#calendarItemDate"
                );

            if (dateInput) {

                dateInput.value =
                    selectedCalendarDate;

                dateInput.min =
                    todayString();

            }

            openModal(
                "#calendarModal"
            );

        }
    );


document
    .querySelector(
        "#calendarForm"
    )
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const title =
                document.querySelector(
                    "#calendarItemTitle"
                )?.value.trim();


            const date =
                document.querySelector(
                    "#calendarItemDate"
                )?.value;


            const type =
                document.querySelector(
                    "#calendarItemType"
                )?.value ||
                "reminder";


            if (!title || !date) {

                showToast(
                    "Please enter a title and date.",
                    "error"
                );

                return;

            }


            if (
                date <
                todayString()
            ) {

                showToast(
                    "Calendar dates cannot be before today.",
                    "error"
                );

                return;

            }


            calendarItems.push({

                id: createId(),

                title,

                date,

                type

            });


            saveData();

            event.target.reset();

            closeModal(
                "#calendarModal"
            );

            selectedCalendarDate =
                date;

            renderCalendar();

            renderDashboard();

            showToast(
                "Calendar item added.",
                "success"
            );

        }
    );


/* =========================================================
   SUBJECTS
========================================================= */

let editingSubjectId = null;


function prepareSubjectModal() {

    editingSubjectId = null;

    const form =
        document.querySelector(
            "#subjectForm"
        );

    if (form) {
        form.reset();
    }


    const heading =
        document.querySelector(
            "#subjectModal h2"
        );

    if (heading) {
        heading.textContent =
            "Add Subject";
    }


    const submit =
        document.querySelector(
            "#subjectForm [type='submit']"
        );

    if (submit) {
        submit.textContent =
            "Create Subject";
    }

}


document
    .querySelector(
        "#addSubjectButton"
    )
    ?.addEventListener(
        "click",
        () => {

            prepareSubjectModal();

            openModal(
                "#subjectModal"
            );

        }
    );


document
    .querySelector(
        "#subjectForm"
    )
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document
                    .querySelector(
                        "#subjectName"
                    )
                    ?.value
                    .trim();


            const color =
                document
                    .querySelector(
                        "#subjectColor"
                    )?.value ||
                "#7c5cff";


            if (!name) {

                showToast(
                    "Enter a subject name.",
                    "error"
                );

                return;

            }


            const duplicate =
                subjects.some(
                    subject =>
                        subject.name
                            .toLowerCase() ===
                        name.toLowerCase() &&
                        subject.id !==
                        editingSubjectId
                );


            if (duplicate) {

                showToast(
                    "That subject already exists.",
                    "error"
                );

                return;

            }


            if (editingSubjectId) {

                const subject =
                    subjects.find(
                        item =>
                            item.id ===
                            editingSubjectId
                    );

                if (subject) {

                    const oldName =
                        subject.name;

                    subject.name =
                        name;

                    subject.color =
                        color;

                    tasks.forEach(task => {

                        if (
                            task.subject ===
                            oldName
                        ) {

                            task.subject =
                                name;

                        }

                    });

                }

            } else {

                subjects.push({

                    id: createId(),

                    name,

                    color,

                    schedule: [],

                    notes: [],

                    createdAt:
                        new Date().toISOString()

                });

            }


            saveData();

            event.target.reset();

            closeModal(
                "#subjectModal"
            );

            renderSubjects();

            renderDashboard();

            showToast(
                editingSubjectId
                    ? "Subject updated."
                    : "Subject created.",
                "success"
            );

            editingSubjectId = null;

        }
    );


function editSubject(subjectId) {

    const subject =
        subjects.find(
            item =>
                item.id === subjectId
        );

    if (!subject) {
        return;
    }


    editingSubjectId =
        subjectId;


    const name =
        document.querySelector(
            "#subjectName"
        );

    const color =
        document.querySelector(
            "#subjectColor"
        );


    if (name) {
        name.value =
            subject.name;
    }

    if (color) {
        color.value =
            subject.color ||
            "#7c5cff";
    }


    const heading =
        document.querySelector(
            "#subjectModal h2"
        );

    if (heading) {
        heading.textContent =
            "Edit Subject";
    }


    const submit =
        document.querySelector(
            "#subjectForm [type='submit']"
        );

    if (submit) {
        submit.textContent =
            "Save Changes";
    }


    openModal(
        "#subjectModal"
    );

}


async function deleteSubject(subjectId) {

    const subject =
        subjects.find(
            item =>
                item.id === subjectId
        );

    if (!subject) {
        return;
    }


    if (!(await confirmAction(
        `Delete "${subject.name}"? The subject will be removed. Existing tasks will remain but will no longer be associated with this subject.`
    ))) {
        return;
    }


    tasks.forEach(task => {

        if (
            task.subject ===
            subject.name
        ) {

            task.subject = "";

        }

    });


    subjects =
        subjects.filter(
            item =>
                item.id !== subjectId
        );


    saveData();

    renderAll();

    showToast(
        "Subject deleted.",
        "success"
    );

}


/* =========================================================
   SUBJECT SCHEDULE + NOTES UI
========================================================= */

function ensureSubjectExtras() {

    const section =
        document.querySelector(
            "#subjectsSection"
        );

    if (!section) {
        return;
    }


    if (
        document.querySelector(
            "#subjectPlannerArea"
        )
    ) {
        return;
    }


    const area =
        document.createElement("div");

    area.id =
        "subjectPlannerArea";

    area.className =
        "card subject-planner-area";

    area.innerHTML = `

        <div class="card-header">

            <div>
                <p class="card-eyebrow">
                    PLANNER
                </p>

                <h2>Subject Planner</h2>

                <p>
                    Select a subject to manage its schedule
                    and PDF notes.
                </p>
            </div>

        </div>

        <div
            id="subjectPlannerContent">
        </div>

    `;


    const grid =
        document.querySelector(
            "#subjectsGrid"
        );

    if (grid) {
        grid.after(area);
    } else {
        section.appendChild(area);
    }

}


function renderSubjectPlanner() {

    ensureSubjectExtras();

    const container =
        document.querySelector(
            "#subjectPlannerContent"
        );

    if (!container) {
        return;
    }


    if (!subjects.length) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    Create a subject first
                </h3>

                <p>
                    Your subject schedule and PDF notes
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    let selectedId =
        container.dataset.selectedSubject ||
        subjects[0].id;


    if (
        !subjects.some(
            subject =>
                subject.id === selectedId
        )
    ) {

        selectedId =
            subjects[0].id;

    }


    container.dataset.selectedSubject =
        selectedId;


    const subject =
        subjects.find(
            item =>
                item.id === selectedId
        );


    if (!subject) {
        return;
    }


    if (!Array.isArray(subject.schedule)) {
        subject.schedule = [];
    }

    if (!Array.isArray(subject.notes)) {
        subject.notes = [];
    }


    container.innerHTML = `

        <div class="subject-planner-toolbar">

            <select id="plannerSubjectSelect">

                ${subjects.map(item => `

                    <option
                        value="${escapeHTML(item.id)}"
                        ${item.id === selectedId ? "selected" : ""}>
                        ${escapeHTML(item.name)}
                    </option>

                `).join("")}

            </select>

            <button
                type="button"
                class="primary-button"
                id="addScheduleButton">
                + Add Schedule
            </button>

            <button
                type="button"
                class="secondary-button"
                id="uploadSubjectPdfButton">
                + Add PDF Note
            </button>

            <input
                type="file"
                id="subjectPdfInput"
                accept="application/pdf"
                hidden>

        </div>


        <div class="subject-planner-columns">

            <div>

                <h3>
                    Schedule
                </h3>

                <div
                    id="subjectScheduleList">

                    ${
                        subject.schedule.length
                            ? subject.schedule
                                .sort(
                                    (a, b) =>
                                        a.date.localeCompare(
                                            b.date
                                        )
                                )
                                .map(
                                    scheduleHTML
                                )
                                .join("")
                            : `
                                <div class="empty-state">
                                    <h3>
                                        No schedule yet
                                    </h3>

                                    <p>
                                        Add classes, study sessions,
                                        exams or other plans.
                                    </p>
                                </div>
                            `
                    }

                </div>

            </div>


            <div>

                <h3>
                    PDF Notes
                </h3>

                <div
                    id="subjectNotesList">

                    ${
                        subject.notes.length
                            ? subject.notes
                                .map(
                                    noteHTML
                                )
                                .join("")
                            : `
                                <div class="empty-state">
                                    <h3>
                                        No PDF notes
                                    </h3>

                                    <p>
                                        Upload PDF notes for this subject.
                                    </p>
                                </div>
                            `
                    }

                </div>

            </div>

        </div>

    `;


    document
        .querySelector(
            "#plannerSubjectSelect"
        )
        ?.addEventListener(
            "change",
            event => {

                container.dataset.selectedSubject =
                    event.target.value;

                renderSubjectPlanner();

            }
        );


    document
        .querySelector(
            "#addScheduleButton"
        )
        ?.addEventListener(
            "click",
            () => openScheduleForm(
                selectedId
            )
        );


    document
        .querySelector(
            "#uploadSubjectPdfButton"
        )
        ?.addEventListener(
            "click",
            () =>
                document
                    .querySelector(
                        "#subjectPdfInput"
                    )
                    ?.click()
        );


    document
        .querySelector(
            "#subjectPdfInput"
        )
        ?.addEventListener(
            "change",
            event =>
                handlePdfUpload(
                    selectedId,
                    event
                )
        );

}


function scheduleHTML(schedule) {

    return `

        <div class="schedule-item">

            <div>

                <strong>
                    ${escapeHTML(
                        schedule.title
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        formatDate(
                            schedule.date
                        )
                    )}

                    ${
                        schedule.time
                            ? ` · ${escapeHTML(schedule.time)}`
                            : ""
                    }

                    ${
                        schedule.type
                            ? ` · ${escapeHTML(schedule.type)}`
                            : ""
                    }
                </small>

            </div>

            <button
                type="button"
                class="task-delete"
                data-schedule-delete="${escapeHTML(schedule.id)}">
                ×
            </button>

        </div>

    `;

}


function noteHTML(note) {

    return `

        <div class="schedule-item">

            <div>

                <strong>
                    ${escapeHTML(
                        note.name
                    )}
                </strong>

                <small>
                    ${formatBytes(
                        note.size
                    )}

                    ·
                    ${formatDate(
                        note.createdAt.slice(0, 10)
                    )}
                </small>

            </div>

            <div>

                <button
                    type="button"
                    class="small-button"
                    data-pdf-open="${escapeHTML(note.id)}">
                    Open
                </button>

                <button
                    type="button"
                    class="task-delete"
                    data-pdf-delete="${escapeHTML(note.id)}">
                    ×
                </button>

            </div>

        </div>

    `;

}


function openScheduleForm(subjectId) {

    const existing =
        document.querySelector(
            "#scheduleModal"
        );

    if (existing) {
        existing.remove();
    }


    const modal =
        document.createElement("div");

    modal.id =
        "scheduleModal";

    modal.className =
        "modal-overlay show";


    modal.innerHTML = `

        <div class="modal">

            <div class="modal-header">

                <div>
                    <p class="card-eyebrow">
                        SUBJECT PLANNER
                    </p>

                    <h2>
                        Add Schedule
                    </h2>
                </div>

                <button
                    type="button"
                    class="close-modal"
                    id="closeScheduleModal">
                    ×
                </button>

            </div>


            <form id="scheduleForm">

                <div class="form-group">

                    <label>
                        Title
                    </label>

                    <input
                        id="scheduleTitle"
                        type="text"
                        required
                        placeholder="Math class / Revision / Exam">

                </div>


                <div class="form-row">

                    <div class="form-group">

                        <label>
                            Date
                        </label>

                        <input
                            id="scheduleDate"
                            type="date"
                            min="${todayString()}"
                            required>

                    </div>


                    <div class="form-group">

                        <label>
                            Time
                        </label>

                        <input
                            id="scheduleTime"
                            type="time">

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Type
                    </label>

                    <select id="scheduleType">

                        <option value="class">
                            Class
                        </option>

                        <option value="study">
                            Study
                        </option>

                        <option value="exam">
                            Exam
                        </option>

                        <option value="assignment">
                            Assignment
                        </option>

                        <option value="other">
                            Other
                        </option>

                    </select>

                </div>


                <button
                    type="submit"
                    class="submit-task">
                    Add Schedule
                </button>

            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const close =
        () => modal.remove();


    document
        .querySelector(
            "#closeScheduleModal"
        )
        ?.addEventListener(
            "click",
            close
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                close();
            }

        }
    );


    document
        .querySelector(
            "#scheduleForm"
        )
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    document
                        .querySelector(
                            "#scheduleTitle"
                        )
                        ?.value
                        .trim();


                const date =
                    document
                        .querySelector(
                            "#scheduleDate"
                        )
                        ?.value;


                const time =
                    document
                        .querySelector(
                            "#scheduleTime"
                        )
                        ?.value;


                const type =
                    document
                        .querySelector(
                            "#scheduleType"
                        )
                        ?.value;


                if (
                    !title ||
                    !date
                ) {

                    showToast(
                        "Enter a title and date.",
                        "error"
                    );

                    return;

                }


                if (
                    date <
                    todayString()
                ) {

                    showToast(
                        "Schedule dates cannot be before today.",
                        "error"
                    );

                    return;

                }


                const subject =
                    subjects.find(
                        item =>
                            item.id ===
                            subjectId
                    );


                if (!subject) {
                    return;
                }


                if (
                    !Array.isArray(
                        subject.schedule
                    )
                ) {

                    subject.schedule =
                        [];

                }


                subject.schedule.push({

                    id: createId(),

                    title,

                    date,

                    time,

                    type,

                    createdAt:
                        new Date().toISOString()

                });


                saveData();

                close();

                renderSubjects();

                showToast(
                    "Schedule added.",
                    "success"
                );

            }
        );

}


document.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "[data-schedule-delete]"
            );

        if (!button) {
            return;
        }


        const container =
            document.querySelector(
                "#subjectPlannerContent"
            );

        const subjectId =
            container?.dataset
                .selectedSubject;


        const subject =
            subjects.find(
                item =>
                    item.id ===
                    subjectId
            );


        if (!subject) {
            return;
        }


        if (!(await confirmAction("Delete this schedule item?"))) {
            return;
        }


        subject.schedule =
            subject.schedule.filter(
                item =>
                    item.id !==
                    button.dataset.scheduleDelete
            );


        saveData();

        renderSubjectPlanner();

    }
);


/* =========================================================
   PDF NOTES
========================================================= */

/*
    PDF files are stored using IndexedDB rather than
    localStorage. This prevents large PDFs from filling
    localStorage immediately.
*/

const PDF_DB_NAME =
    "AceArchPDFDatabase";

const PDF_STORE_NAME =
    "notes";


function openPdfDatabase() {

    return new Promise(
        (resolve, reject) => {

            if (
                !("indexedDB" in window)
            ) {

                reject(
                    new Error(
                        "IndexedDB is not supported."
                    )
                );

                return;

            }


            const request =
                indexedDB.open(
                    PDF_DB_NAME,
                    1
                );


            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;

                    if (
                        !db.objectStoreNames
                            .contains(
                                PDF_STORE_NAME
                            )
                    ) {

                        db.createObjectStore(
                            PDF_STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );

                    }

                };


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        }
    );

}


async function storePdfFile(fileRecord) {

    const db =
        await openPdfDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    PDF_STORE_NAME,
                    "readwrite"
                );


            transaction
                .objectStore(
                    PDF_STORE_NAME
                )
                .put(fileRecord);


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


async function getPdfFile(id) {

    const db =
        await openPdfDatabase();


    return new Promise(
        (resolve, reject) => {

            const request =
                db
                    .transaction(
                        PDF_STORE_NAME,
                        "readonly"
                    )
                    .objectStore(
                        PDF_STORE_NAME
                    )
                    .get(id);


            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    db.close();

                    reject(
                        request.error
                    );

                };

        }
    );

}


async function deletePdfFile(id) {

    const db =
        await openPdfDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    PDF_STORE_NAME,
                    "readwrite"
                );


            transaction
                .objectStore(
                    PDF_STORE_NAME
                )
                .delete(id);


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


async function handlePdfUpload(
    subjectId,
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (
        file.type !==
        "application/pdf"
    ) {

        showToast(
            "Only PDF files are allowed.",
            "error"
        );

        event.target.value = "";

        return;

    }


    /*
        25 MB safety limit for this browser version.
    */

    const maxSize =
        25 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        showToast(
            "PDF must be smaller than 25 MB.",
            "error"
        );

        event.target.value = "";

        return;

    }


    const subject =
        subjects.find(
            item =>
                item.id === subjectId
        );


    if (!subject) {
        return;
    }


    if (
        !Array.isArray(
            subject.notes
        )
    ) {

        subject.notes = [];

    }


    const id =
        createId();


    try {

        await storePdfFile({

            id,

            blob: file,

            name: file.name,

            type: file.type,

            size: file.size,

            subjectId,

            createdAt:
                new Date().toISOString()

        });


        subject.notes.push({

            id,

            name: file.name,

            size: file.size,

            createdAt:
                new Date().toISOString()

        });


        saveData();

        renderSubjectPlanner();

        showToast(
            "PDF note added.",
            "success"
        );

    } catch (error) {

        console.error(
            "PDF upload error:",
            error
        );

        showToast(
            "Could not save the PDF.",
            "error"
        );

    }


    event.target.value = "";

}


function formatBytes(bytes) {

    if (!bytes) {
        return "0 KB";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    let size =
        Number(bytes);

    let index = 0;


    while (
        size >= 1024 &&
        index <
        units.length - 1
    ) {

        size /= 1024;

        index++;

    }


    return `${size.toFixed(
        index === 0 ? 0 : 1
    )} ${units[index]}`;

}


document.addEventListener(
    "click",
    async event => {

        const openButton =
            event.target.closest(
                "[data-pdf-open]"
            );


        if (openButton) {

            try {

                const record =
                    await getPdfFile(
                        openButton.dataset.pdfOpen
                    );


                if (
                    !record?.blob
                ) {

                    showToast(
                        "PDF could not be found.",
                        "error"
                    );

                    return;

                }


                const url =
                    URL.createObjectURL(
                        record.blob
                    );


                window.open(
                    url,
                    "_blank",
                    "noopener"
                );


                setTimeout(
                    () =>
                        URL.revokeObjectURL(
                            url
                        ),
                    60000
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Could not open PDF.",
                    "error"
                );

            }

            return;

        }


        const deleteButton =
            event.target.closest(
                "[data-pdf-delete]"
            );


        if (
            deleteButton
        ) {

            const container =
                document.querySelector(
                    "#subjectPlannerContent"
                );


            const subjectId =
                container?.dataset
                    .selectedSubject;


            const subject =
                subjects.find(
                    item =>
                        item.id ===
                        subjectId
                );


            if (!subject) {
                return;
            }


            const note =
                subject.notes.find(
                    item =>
                        item.id ===
                        deleteButton.dataset
                            .pdfDelete
                );


            if (!note) {
                return;
            }


            if (!(await confirmAction(`Delete "${note.name}"?`))) {
                return;
            }


            try {

                await deletePdfFile(
                    note.id
                );

            } catch (error) {

                console.warn(
                    "PDF deletion warning:",
                    error
                );

            }


            subject.notes =
                subject.notes.filter(
                    item =>
                        item.id !==
                        note.id
                );


            saveData();

            renderSubjectPlanner();

            showToast(
                "PDF note deleted.",
                "success"
            );

        }

    }
);


/* =========================================================
   SUBJECT CARDS
========================================================= */

function renderSubjects() {

    const grid =
        document.querySelector(
            "#subjectsGrid"
        );

    const empty =
        document.querySelector(
            "#subjectsEmpty"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML =
        subjects
            .map(subject => {

                const taskCount =
                    tasks.filter(
                        task =>
                            task.subject ===
                            subject.name
                    ).length;


                const scheduleCount =
                    Array.isArray(
                        subject.schedule
                    )
                        ? subject.schedule.length
                        : 0;


                const noteCount =
                    Array.isArray(
                        subject.notes
                    )
                        ? subject.notes.length
                        : 0;


                return `

                    <div
                        class="subject-card"
                        data-subject-id="${escapeHTML(subject.id)}">

                        <div
                            class="subject-color"
                            style="background:${escapeHTML(subject.color || "#7c5cff")}">
                        </div>

                        <h3>
                            ${escapeHTML(
                                subject.name
                            )}
                        </h3>

                        <p>
                            ${taskCount}
                            ${taskCount === 1 ? "task" : "tasks"}
                        </p>

                        <small>
                            ${scheduleCount}
                            schedule
                            ·
                            ${noteCount}
                            PDF
                        </small>

                        <div class="subject-card-actions">

                            <button
                                type="button"
                                class="small-button"
                                data-subject-edit="${escapeHTML(subject.id)}">
                                Edit
                            </button>

                            <button
                                type="button"
                                class="small-button"
                                data-subject-plan="${escapeHTML(subject.id)}">
                                Plan
                            </button>

                            <button
                                type="button"
                                class="task-delete"
                                data-subject-delete="${escapeHTML(subject.id)}">
                                Delete
                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");


    if (empty) {

        empty.style.display =
            subjects.length
                ? "none"
                : "flex";

    }


    renderSubjectPlanner();

}


document.addEventListener(
    "click",
    event => {

        const edit =
            event.target.closest(
                "[data-subject-edit]"
            );

        if (edit) {

            editSubject(
                edit.dataset.subjectEdit
            );

            return;

        }


        const plan =
            event.target.closest(
                "[data-subject-plan]"
            );

        if (plan) {

            ensureSubjectExtras();

            const container =
                document.querySelector(
                    "#subjectPlannerContent"
                );

            if (container) {

                container.dataset
                    .selectedSubject =
                    plan.dataset.subjectPlan;

            }

            renderSubjectPlanner();

            document
                .querySelector(
                    "#subjectPlannerArea"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            return;

        }


        const deleteButton =
            event.target.closest(
                "[data-subject-delete]"
            );

        if (deleteButton) {

            deleteSubject(
                deleteButton.dataset.subjectDelete
            );

        }

    }
);


/* =========================================================
   FOCUS TIMER
========================================================= */

let focusDurationSeconds = 25 * 60;
let focusRemaining = focusDurationSeconds;
let focusInterval = null;
let focusRunning = false;

function renderTimer() {
    const timer = document.querySelector("#focusTimer");
    if (!timer) return;

    const minutes = Math.floor(focusRemaining / 60);
    const seconds = focusRemaining % 60;

    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateFocusInput() {
    const input = document.querySelector("#focusMinutes");
    if (input) {
        input.value = Math.max(1, Math.round(focusDurationSeconds / 60));
    }
}

function setFocusDuration(minutes, showMessage = true) {
    minutes = Number(minutes);

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
        showToast("Focus time must be between 1 and 180 minutes.", "error");
        return false;
    }

    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }

    focusRunning = false;
    focusDurationSeconds = Math.round(minutes * 60);
    focusRemaining = focusDurationSeconds;

    const button = document.querySelector("#focusStart");
    const status = document.querySelector("#focusStatus");

    if (button) button.textContent = "Start";
    if (status) status.textContent = "Ready to focus";

    updateFocusInput();
    renderTimer();

    document.querySelectorAll(".quick-focus-button").forEach(item => {
        item.classList.toggle(
            "selected",
            Number(item.dataset.focusMinutes) === Math.round(minutes)
        );
    });

    if (showMessage) {
        showToast(`${Math.round(minutes)}-minute focus timer set.`, "success");
    }

    return true;
}

function startFocus() {
    if (focusInterval) return;

    if (focusRemaining <= 0) {
        focusRemaining = focusDurationSeconds;
    }

    focusRunning = true;

    const button = document.querySelector("#focusStart");
    const status = document.querySelector("#focusStatus");

    if (button) button.textContent = "Pause";
    if (status) status.textContent = "Focus session in progress";

    focusInterval = setInterval(() => {
        focusRemaining--;
        renderTimer();

        if (focusRemaining <= 0) {
            finishFocus();
        }
    }, 1000);
}

function pauseFocus() {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }

    focusRunning = false;

    const button = document.querySelector("#focusStart");
    const status = document.querySelector("#focusStatus");

    if (button) button.textContent = "Resume";
    if (status) status.textContent = "Session paused";
}

function finishFocus() {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }

    focusRunning = false;

    const minutes = Math.max(1, Math.round(focusDurationSeconds / 60));

    focusSessions.push({
        id: createId(),
        minutes,
        date: todayString(),
        completedAt: new Date().toISOString()
    });

    if (settings.studyNotifications) {
        notifications.push({
            id: createId(),
            title: "Focus session completed",
            message: `Great work. Your ${minutes}-minute study session was recorded.`,
            createdAt: new Date().toISOString(),
            read: false
        });
    }

    saveData();

    focusRemaining = focusDurationSeconds;

    const button = document.querySelector("#focusStart");
    const status = document.querySelector("#focusStatus");

    if (button) button.textContent = "Start";
    if (status) status.textContent = "Session complete";

    renderTimer();
    updateFocusStats();
    updateNotifications();
    updateStats();
    renderAnalytics();

    showToast(`${minutes}-minute focus session completed.`, "success");
}

function resetFocus() {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }

    focusRunning = false;
    focusRemaining = focusDurationSeconds;

    const button = document.querySelector("#focusStart");
    const status = document.querySelector("#focusStatus");

    if (button) button.textContent = "Start";
    if (status) status.textContent = "Ready to focus";

    renderTimer();
}

document.querySelector("#focusStart")?.addEventListener("click", () => {
    if (focusInterval) {
        pauseFocus();
    } else {
        startFocus();
    }
});

document.querySelector("#focusReset")?.addEventListener("click", resetFocus);

document.querySelector("#applyFocusDuration")?.addEventListener("click", () => {
    const input = document.querySelector("#focusMinutes");
    if (input) setFocusDuration(input.value);
});

document.querySelector("#focusMinutes")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector("#applyFocusDuration")?.click();
    }
});

document.querySelectorAll(".quick-focus-button").forEach(button => {
    button.addEventListener("click", () => {
        setFocusDuration(button.dataset.focusMinutes);
    });
});

function renderFocusPage() {
    updateFocusStats();
    updateFocusInput();
    renderTimer();
}

function updateFocusStats() {
    const today = todayString();

    const sessions = focusSessions.filter(
        session => session.date === today
    );

    const minutes = sessions.reduce(
        (sum, session) => sum + (Number(session.minutes) || 0),
        0
    );

    const sessionsElement = document.querySelector("#todaySessions");
    if (sessionsElement) sessionsElement.textContent = sessions.length;

    const minutesElement = document.querySelector("#todayFocusMinutes");
    if (minutesElement) minutesElement.textContent = minutes;
}

/* =========================================================
   ANALYTICS
========================================================= */

function getLastSevenDays() {

    const days = [];


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );


        days.push({

            date:
                dateToString(date),

            label:
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                )

        });

    }


    return days;

}


function renderAnalytics() {
    updateStats();

    const container = document.querySelector("#analyticsBars");
    if (!container) return;

    const days = getLastSevenDays();

    const taskValues = days.map(day =>
        tasks.filter(task =>
            task.completed &&
            (task.completedAt || task.createdAt)?.startsWith(day.date)
        ).length
    );

    const focusValues = days.map(day =>
        focusSessions
            .filter(session => session.date === day.date)
            .reduce((sum, session) => sum + (Number(session.minutes) || 0), 0)
    );

    const maxTasks = Math.max(...taskValues, 1);

    container.innerHTML = days.map((day, index) => `
        <div class="analytics-bar-wrapper" title="${taskValues[index]} task${taskValues[index] === 1 ? "" : "s"} completed • ${focusValues[index]} focus minutes">
            <div class="analytics-bar-value">${taskValues[index]}</div>
            <div
                class="analytics-bar"
                style="height:${Math.max((taskValues[index] / maxTasks) * 78, taskValues[index] ? 8 : 3)}%"
            ></div>
            <span>${escapeHTML(day.label)}</span>
        </div>
    `).join("");

    const weekFocus = focusValues.reduce((sum, value) => sum + value, 0);
    const weekTasks = taskValues.reduce((sum, value) => sum + value, 0);

    const weekFocusElement = document.querySelector("#analyticsWeekFocus");
    if (weekFocusElement) weekFocusElement.textContent = `${weekFocus}m`;

    const focusProgress = document.querySelector("#analyticsFocusProgress");
    if (focusProgress) {
        const target = 300;
        focusProgress.style.width = `${Math.min((weekFocus / target) * 100, 100)}%`;
    }

    const focusProgressText = document.querySelector("#analyticsFocusProgressText");
    if (focusProgressText) {
        focusProgressText.textContent =
            weekFocus >= 300
                ? "Weekly focus goal reached"
                : `${weekFocus} minutes logged • ${300 - weekFocus} minutes to a 5-hour weekly goal`;
    }

    const insight = document.querySelector("#analyticsInsight");
    const insightDetail = document.querySelector("#analyticsInsightDetail");

    if (insight && insightDetail) {
        const bestIndex = taskValues.indexOf(Math.max(...taskValues));
        const bestDay = days[bestIndex];

        if (weekTasks === 0 && weekFocus === 0) {
            insight.textContent = "Build your first streak";
            insightDetail.textContent = "Complete a task or finish a focus session to start seeing your productivity trend.";
        } else if (weekTasks > 0 && weekFocus > 0) {
            insight.textContent = `${weekTasks} tasks + ${weekFocus} focus minutes`;
            insightDetail.textContent = `Your busiest day was ${bestDay.label}. Keep combining task progress with focused study time.`;
        } else if (weekTasks > 0) {
            insight.textContent = `${weekTasks} task${weekTasks === 1 ? "" : "s"} completed this week`;
            insightDetail.textContent = `Your strongest task day was ${bestDay.label}. Add a focus session to balance your workflow.`;
        } else {
            insight.textContent = `${weekFocus} focus minutes logged`;
            insightDetail.textContent = "Nice focus streak. Add a few completed tasks to make your analytics more complete.";
        }
    }
}


function renderWeeklyBars() {

    const container =
        document.querySelector(
            "#weeklyBars"
        );


    if (!container) {
        return;
    }


    const days =
        getLastSevenDays();


    const values =
        days.map(
            day =>
                tasks.filter(
                    task =>
                        task.completed &&
                        (
                            task.completedAt ||
                            task.createdAt
                        )?.startsWith(
                            day.date
                        )
                ).length
        );


    const max =
        Math.max(
            ...values,
            1
        );


    container.innerHTML =
        days.map(
            (day, index) => `

                <div
                    class="analytics-bar-wrapper">

                    <div
                        class="analytics-bar"
                        style="height:${Math.max(
                            (
                                values[index] /
                                max
                            ) * 80,
                            3
                        )}%">
                    </div>

                    <span>
                        ${escapeHTML(
                            day.label
                        )}
                    </span>

                </div>

            `
        ).join("");

}


/* =========================================================
   SETTINGS
========================================================= */

document
    .querySelectorAll(
        ".settings-tab"
    )
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.settings;


                document
                    .querySelectorAll(
                        ".settings-tab"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                document
                    .querySelectorAll(
                        ".settings-panel"
                    )
                    .forEach(
                        panel =>
                            panel.classList.remove(
                                "active"
                            )
                    );


                tab.classList.add(
                    "active"
                );


                document
                    .querySelector(
                        `[data-settings-panel="${target}"]`
                    )
                    ?.classList.add(
                        "active"
                    );

            }
        );

    });


function loadSettingsUI() {

    const font =
        document.querySelector(
            "#fontSelector"
        );

    if (font) {
        font.value =
            settings.font;
    }


    const taskNotifications =
        document.querySelector(
            "#taskNotifications"
        );

    if (taskNotifications) {

        taskNotifications.checked =
            settings.taskNotifications;

    }


    const deadlineNotifications =
        document.querySelector(
            "#deadlineNotifications"
        );

    if (deadlineNotifications) {

        deadlineNotifications.checked =
            settings.deadlineNotifications;

    }


    const studyNotifications =
        document.querySelector(
            "#studyNotifications"
        );

    if (studyNotifications) {

        studyNotifications.checked =
            settings.studyNotifications;

    }


    applyCustomization();

}


function applyCustomization() {

    document.documentElement.style
        .setProperty(
            "--accent",
            settings.accent
        );


    document.body.style.fontFamily =
        settings.font;


    document.body.dataset.density =
        settings.density;


    /*
        Proper system theme support.
    */

    if (
        settings.theme === "system"
    ) {

        const prefersLight =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches;


        document.body.classList.toggle(
            "light",
            prefersLight
        );

    } else {

        document.body.classList.toggle(
            "light",
            settings.theme === "light"
        );

    }


    document
        .querySelectorAll(
            ".color-choice"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.color ===
                settings.accent
            );

        });


    document
        .querySelectorAll(
            "[data-theme]"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.theme ===
                settings.theme
            );

        });


    document
        .querySelectorAll(
            "[data-density]"
        )
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.density ===
                settings.density
            );

        });


    updateCurrentDate();

    renderCalendar();

}


document
    .querySelectorAll(
        "[data-theme]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                settings.theme =
                    button.dataset.theme;

                saveData();

                applyCustomization();

            }
        );

    });


document
    .querySelectorAll(
        ".color-choice"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                settings.accent =
                    button.dataset.color;

                saveData();

                applyCustomization();

            }
        );

    });


document
    .querySelector(
        "#fontSelector"
    )
    ?.addEventListener(
        "change",
        event => {

            settings.font =
                event.target.value;

            saveData();

            applyCustomization();

        }
    );


document
    .querySelectorAll(
        "[data-density]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                settings.density =
                    button.dataset.density;

                saveData();

                applyCustomization();

            }
        );

    });




[
    "taskNotifications",
    "deadlineNotifications",
    "studyNotifications"
].forEach(id => {

    document
        .querySelector(
            `#${id}`
        )
        ?.addEventListener(
            "change",
            event => {

                settings[id] =
                    event.target.checked;

                saveData();

            }
        );

});


document
    .querySelector(
        "#resetCustomization"
    )
    ?.addEventListener(
        "click",
        () => {

            settings.theme =
                defaultSettings.theme;

            settings.accent =
                defaultSettings.accent;

            settings.font =
                defaultSettings.font;

            settings.density =
                defaultSettings.density;

            saveData();

            loadSettingsUI();

            showToast(
                "Customization reset.",
                "success"
            );

        }
    );





/* =========================================================
   DATA CLEAR
========================================================= */

document
    .querySelector(
        "#clearLocalData"
    )
    ?.addEventListener(
        "click",
        async () => {

            const confirmed = await confirmAction(
                "This will remove all AceArch data stored in this browser. Continue?"
            );


            if (!confirmed) {
                return;
            }


            localStorage.removeItem(
                STORAGE_KEYS.tasks
            );

            localStorage.removeItem(
                STORAGE_KEYS.calendar
            );

            localStorage.removeItem(
                STORAGE_KEYS.subjects
            );

            localStorage.removeItem(
                STORAGE_KEYS.focus
            );

            localStorage.removeItem(
                STORAGE_KEYS.notifications
            );

            localStorage.removeItem(
                STORAGE_KEYS.settings
            );


            /*
                Also clear saved PDFs.
            */

            try {

                const db =
                    await openPdfDatabase();

                const transaction =
                    db.transaction(
                        PDF_STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        PDF_STORE_NAME
                    )
                    .clear();

                transaction.oncomplete =
                    () => {

                        db.close();

                        location.reload();

                    };

                transaction.onerror =
                    () => {

                        db.close();

                        location.reload();

                    };

            } catch {

                location.reload();

            }

        }
    );


/* =========================================================
   NOTIFICATIONS
========================================================= */

const notificationPanel =
    document.querySelector(
        "#notificationPanel"
    );


function updateNotifications() {

    const list =
        document.querySelector(
            "#notificationList"
        );


    const dot =
        document.querySelector(
            "#notificationDot"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        notifications.length

            ? notifications
                .slice()
                .reverse()
                .map(
                    notification => `

                    <div class="notification">

                        <strong>
                            ${escapeHTML(
                                notification.title
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                notification.message
                            )}
                        </small>

                    </div>

                `
                )
                .join("")

            : `

                <div class="empty-state">

                    <div class="empty-icon">
                        ♢
                    </div>

                    <h3>
                        No notifications
                    </h3>

                    <p>
                        You're all caught up.
                    </p>

                </div>

            `;


    if (dot) {

        dot.classList.toggle(
            "show",
            notifications.length > 0
        );

    }

}


function toggleNotifications() {

    notificationPanel
        ?.classList.toggle(
            "show"
        );

}


document
    .querySelector(
        "#notificationButton"
    )
    ?.addEventListener(
        "click",
        toggleNotifications
    );


document
    .querySelector(
        "#mobileNotificationButton"
    )
    ?.addEventListener(
        "click",
        toggleNotifications
    );


document
    .querySelector(
        "#clearNotifications"
    )
    ?.addEventListener(
        "click",
        () => {

            notifications = [];

            saveData();

            updateNotifications();

            showToast(
                "Notifications cleared.",
                "success"
            );

        }
    );


/* =========================================================
   DEADLINE NOTIFICATIONS
========================================================= */

function checkDeadlineNotifications() {

    if (
        !settings.deadlineNotifications
    ) {
        return;
    }


    const today =
        todayString();


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    const tomorrowString =
        dateToString(
            tomorrow
        );


    const notificationDate =
        today;


    tasks
        .filter(
            task =>
                !task.completed &&
                (
                    task.deadline ===
                    today ||
                    task.deadline ===
                    tomorrowString
                )
        )
        .forEach(task => {

            const key =
                `${task.id}_${notificationDate}`;


            const exists =
                notifications.some(
                    notification =>
                        notification.key ===
                        key
                );


            if (exists) {
                return;
            }


            notifications.push({

                id: createId(),

                key,

                title:
                    task.deadline === today
                        ? "Task due today"
                        : "Task due tomorrow",

                message:
                    `${task.title} is due ${formatDate(task.deadline)}.`,

                createdAt:
                    new Date().toISOString(),

                read: false

            });

        });


    saveData();

    updateNotifications();

}


/* =========================================================
   GLOBAL ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        document
            .querySelectorAll(
                ".modal-overlay.show"
            )
            .forEach(
                modal =>
                    modal.classList.remove(
                        "show"
                    )
            );


        notificationPanel
            ?.classList.remove(
                "show"
            );


        closeSidebar();

    }
);


/* =========================================================
   PREVENT INVALID DATES
========================================================= */

function setMinimumDates() {

    const today =
        todayString();


    document
        .querySelectorAll(
            'input[type="date"]'
        )
        .forEach(input => {

            /*
                Only enforce this on creation/planning
                fields. Calendar browsing is handled
                separately.
            */

            if (
                input.id === "taskDate" ||
                input.id === "calendarItemDate" ||
                input.id === "scheduleDate"
            ) {

                input.min =
                    today;

            }

        });

}


setMinimumDates();


/* =========================================================
   SYSTEM THEME CHANGE
========================================================= */

if (
    window.matchMedia
) {

    const media =
        window.matchMedia(
            "(prefers-color-scheme: light)"
        );


    const systemThemeChanged =
        () => {

            if (
                settings.theme ===
                "system"
            ) {

                applyCustomization();

            }

        };


    if (
        media.addEventListener
    ) {

        media.addEventListener(
            "change",
            systemThemeChanged
        );

    }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderDashboard();

    renderTasks();

    renderCalendar();

    renderSubjects();

    updateFocusStats();

    renderAnalytics();

    updateNotifications();

    loadSettingsUI();

    renderTimer();

}


window.renderAll =
    renderAll;


/* =========================================================
   INITIALIZE
========================================================= */

function initializeAceArch() {

    applyCustomization();

    renderAll();

    renderFocusPage();

    checkDeadlineNotifications();

    setMinimumDates();


    /*
        Keep date-related UI fresh if the app remains
        open past midnight.
    */

    setInterval(
        () => {

            updateCurrentDate();

            setMinimumDates();

            checkDeadlineNotifications();

        },
        60000
    );


    console.log(
        "AceArch loaded successfully."
    );

}


initializeAceArch();