document.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage); 

document.addEventListener('DOMContentLoaded', loadFoldersFromLocalStorage); 

document.addEventListener('DOMContentLoaded', function () { 

    document.querySelectorAll('.folder-section summary').forEach(summary => { 

        summary.addEventListener('click', function () { 

            const details = this.parentNode; 

  

            // Sluit andere geopende details 

            document.querySelectorAll('.folder-section[open]').forEach(openDetails => { 

                if (openDetails !== details) { 

                    openDetails.removeAttribute('open'); 

                } 

            }); 

  

            // Voorkom dat details direct sluit bij klikken 

            setTimeout(() => { 

                details.toggleAttribute('open'); 

            }, 50); 

        }); 

    }); 

}); 

  

// ✅ Popup tonen 

function showPopup(message) { 

    document.getElementById('popup-message').textContent = message; 

    document.getElementById('popup').style.display = 'block'; 

  

    // Speel alarmgeluid af 

    const alarmSound = document.getElementById('alarm-sound'); 

    alarmSound.play(); 

} 

  

// ✅ Popup sluiten 

function closePopup() { 

    document.getElementById('popup').style.display = 'none'; 

  

    // Stop geluid 

    const alarmSound = document.getElementById('alarm-sound'); 

    alarmSound.pause(); 

    alarmSound.currentTime = 0; 

} 

  

let totalTasks = 0; 

let completedTasks = 0; 

let activeTimers = {};  

  

// ✅ Mappen laden vanuit localStorage 

function loadFoldersFromLocalStorage() { 

    const storedFolders = JSON.parse(localStorage.getItem('folders')) || []; 

    const folderList = document.getElementById('folder-list'); 

    const taskFolderSelect = document.getElementById('task-folder'); 

  

    folderList.innerHTML = ''; 

    taskFolderSelect.innerHTML = '<option value="">Selecteer een map</option>'; 

  

    storedFolders.forEach(folder => { 

        const listItem = document.createElement('li'); 

        listItem.textContent = folder; 

  

        const deleteBtn = document.createElement('button'); 

        deleteBtn.textContent = 'Verwijder'; 

        deleteBtn.classList.add('delete-folder-btn'); 

        deleteBtn.addEventListener('click', () => deleteFolder(folder)); 

  

        listItem.appendChild(deleteBtn); 

        folderList.appendChild(listItem); 

  

        const option = document.createElement('option'); 

        option.value = folder; 

        option.textContent = folder; 

        taskFolderSelect.appendChild(option); 

    }); 

} 

  

// ✅ Map verwijderen 

function deleteFolder(folderName) { 

    let storedFolders = JSON.parse(localStorage.getItem('folders')) || []; 

    let storedTasks = JSON.parse(localStorage.getItem('tasks')) || []; 

     

    // Controleer of er taken in de map zitten 

    let tasksInFolder = storedTasks.filter(task => task.folder === folderName); 

     

    let confirmMessage = tasksInFolder.length > 0  

        ? `De map "${folderName}" bevat nog ${tasksInFolder.length} taken. Weet je zeker dat je deze map en de taken wilt verwijderen?` 

        : `Weet je zeker dat je de map "${folderName}" wilt verwijderen?`; 

  

    if (!confirm(confirmMessage)) return; 

  

    // Verwijder de map 

    storedFolders = storedFolders.filter(folder => folder !== folderName); 

    localStorage.setItem('folders', JSON.stringify(storedFolders)); 

  

    // Verwijder taken die in deze map zaten 

    storedTasks = storedTasks.filter(task => task.folder !== folderName); 

    localStorage.setItem('tasks', JSON.stringify(storedTasks)); 

  

    loadFoldersFromLocalStorage(); 

    loadTasksFromLocalStorage(); 

} 

  

  

// ✅ Nieuwe map toevoegen 

document.getElementById('folder-form').addEventListener('submit', function(e) { 

    e.preventDefault(); 

    const folderName = document.getElementById('folder-name').value.trim(); 

    if (!folderName) return; 

  

    let storedFolders = JSON.parse(localStorage.getItem('folders')) || []; 

     

    if (!storedFolders.includes(folderName)) { 

        storedFolders.push(folderName); 

        localStorage.setItem('folders', JSON.stringify(storedFolders)); 

    } 

  

    loadFoldersFromLocalStorage(); 

    loadTasksFromLocalStorage(); 

    e.target.reset(); 

}); 

  

// ✅ Taken laden bij pagina-refresh 

  

function loadTasksFromLocalStorage() { 

    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || []; 

    const groupedTasks = groupTasksByFolder(storedTasks); 

    const taskListContainer = document.getElementById('task-list'); 

    taskListContainer.innerHTML = ''; // Leegmaken voor herladen 

  

    for (const folder in groupedTasks) { 

        const folderSection = document.createElement('details'); 

        folderSection.classList.add('folder-section'); 

  

        const summary = document.createElement('summary'); 

        summary.textContent = folder; 

  

        const taskContainer = document.createElement('ul'); 

        taskContainer.classList.add('task-list'); 

  

        groupedTasks[folder].forEach(task => addTaskToDOM(task, taskContainer, folder)); 

  

        folderSection.appendChild(summary); 

        folderSection.appendChild(taskContainer); 

        taskListContainer.appendChild(folderSection); 

    } 

} 

  

  

    updateProgress(); 

  

// ✅ Groeperen van taken per map 

function groupTasksByFolder(tasks) { 

    return tasks.reduce((groups, task) => { 

        if (!groups[task.folder]) { 

            groups[task.folder] = []; 

        } 

        groups[task.folder].push(task); 

        return groups; 

    }, {}); 

} 

  

// ✅ Nieuwe taak toevoegen 

document.getElementById('task-form').addEventListener('submit', function(e) { 
    

    e.preventDefault(); 

    const taskName = document.getElementById('task-name').value; 

    const hours = parseInt(document.getElementById('task-hours').value, 10) || 0;
const minutes = parseInt(document.getElementById('task-minutes').value, 10) || 0;
const taskTime = (hours * 60) + minutes;
 

    const taskFolder = document.getElementById('task-folder').value; 

  

    if (!taskName || isNaN(taskTime) || !taskFolder) return; 

  

    const newTask = {  

        name: taskName,  

        time: taskTime * 60,  

        remaining: taskTime * 60,  

        completed: false, 

        folder: taskFolder  

    }; 

  

    let storedTasks = JSON.parse(localStorage.getItem('tasks')) || []; 

    storedTasks.push(newTask); 

    localStorage.setItem('tasks', JSON.stringify(storedTasks)); 

  

    loadTasksFromLocalStorage(); 

    updateProgress(); 

    e.target.reset(); 

}); 

  

// ✅ Taak weergeven in de lijst 

function addTaskToDOM(task, taskList, folder) { 

    const listItem = document.createElement('li'); 

    listItem.innerHTML = `  

        <span>${task.name} - <span class="timer">${formatTime(task.remaining)}</span></span> 

        <button class="start-btn">Start</button> 

        <button class="pause-btn" disabled>Pauze</button> 

        <button class="stop-btn" disabled>Stop</button> 

        <button class="delete-btn">Verwijder</button> 

        <input type="checkbox" class="task-complete" ${task.completed ? 'checked' : ''}> 

    `; 

     

    taskList.appendChild(listItem); 

    addEventListeners(listItem, task, folder); 

} 

  

// ✅ Event listeners voor knoppen 

function addEventListeners(listItem, task, folder) { 

    const timerDisplay = listItem.querySelector('.timer'); 

    const startBtn = listItem.querySelector('.start-btn'); 

    const pauseBtn = listItem.querySelector('.pause-btn'); 

    const stopBtn = listItem.querySelector('.stop-btn'); 

    const deleteBtn = listItem.querySelector('.delete-btn'); 

    const checkbox = listItem.querySelector('.task-complete'); 

  

    startBtn.addEventListener('click', () => startTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn)); 

    pauseBtn.addEventListener('click', () => pauseTimer(task, startBtn, pauseBtn)); 

    stopBtn.addEventListener('click', () => stopTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn)); 

    deleteBtn.addEventListener('click', () => deleteTask(task, listItem)); 

  

    checkbox.addEventListener('change', () => { 
    task.completed = checkbox.checked; 
    updateLocalStorage(task); 
    updateFolderProgress(folder, [task]); 
    updateProgress(); // Bijwerken van de voortgangsbalk
});
 

} 

  

/// ✅ Timer starten met popup en geluid wanneer tijd om is 

function startTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn) { 

    if (!activeTimers[task.name]) { 

        activeTimers[task.name] = setInterval(() => { 

            if (task.remaining > 0) { 

                task.remaining--; 

                timerDisplay.textContent = formatTime(task.remaining); 

                updateLocalStorage(task); 

            } else { 

                clearInterval(activeTimers[task.name]); 

                activeTimers[task.name] = null; 

                 

                // 🚨 ALARM AFSPELEN 🚨 

                document.getElementById('alarm-sound').play(); 

                 

                // ⚠️ POPUP TONEN ⚠️ 

                alert(`⏰ Schattieeeee je Tijd is om voor je : ${task.name} taak! ❤️‍🔥`); 

                 

                startBtn.disabled = false; 

                pauseBtn.disabled = true; 

                stopBtn.disabled = true; 

            } 

        }, 1000); 

        startBtn.disabled = true; 

        pauseBtn.disabled = false; 

        stopBtn.disabled = false; 

    } 

} 

  

  

  

// ✅ Timer pauzeren 

function pauseTimer(task, startBtn, pauseBtn) { 

    clearInterval(activeTimers[task.name]); 

    activeTimers[task.name] = null; 

    startBtn.disabled = false; 

    pauseBtn.disabled = true; 

} 

  

// ✅ Timer stoppen 

function stopTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn) { 

    clearInterval(activeTimers[task.name]); 

    activeTimers[task.name] = null; 

    task.remaining = task.time; // Reset de timer 

    timerDisplay.textContent = formatTime(task.remaining); 

    startBtn.disabled = false; 

    pauseBtn.disabled = true; 

    stopBtn.disabled = true; 

} 

  

  

// ✅ Taak verwijderen 

function deleteTask(task, listItem) { 

    let tasks = JSON.parse(localStorage.getItem('tasks')) || []; 

    tasks = tasks.filter(t => t.name !== task.name); 

    localStorage.setItem('tasks', JSON.stringify(tasks)); 

    listItem.remove(); 

    totalTasks--; 

    updateProgress(); 

} 

  

// ✅ Helpers 

function formatTime(seconds) { 

    const mins = Math.floor(seconds / 60); 

    const secs = seconds % 60; 

    return `${mins}:${secs.toString().padStart(2, '0')}`; 

} 

  

function updateProgress() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    totalTasks = tasks.length; // Voeg dit toe!
    completedTasks = tasks.filter(task => task.completed).length;

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    document.getElementById('progress-bar').style.width = `${progress}%`;
document.getElementById('progress-text').textContent = `${Math.round(progress)}% voltooid`;

}


  

function updateFolderProgress(folder, tasks) { 

    const completedInFolder = tasks.filter(task => task.completed).length; 

    const totalInFolder = tasks.length; 

    const progress = totalInFolder > 0 ? (completedInFolder / totalInFolder) * 100 : 0; 

  

    document.getElementById(`progress-bar-${folder}`).style.width = `${progress}%`; 

    document.getElementById(`progress-text-${folder}`).textContent = `${Math.round(progress)}% voltooid`; 

} 

  

function updateLocalStorage(task) { 

    let tasks = JSON.parse(localStorage.getItem('tasks')) || []; 

    const taskIndex = tasks.findIndex(t => t.name === task.name); 

    if (taskIndex > -1) { 

        tasks[taskIndex] = task; 

        localStorage.setItem('tasks', JSON.stringify(tasks)); 

    } 

} 

  

document.addEventListener('DOMContentLoaded', function () { 

    document.querySelectorAll('.folder-section summary').forEach(summary => { 

        summary.addEventListener('click', function () { 

            const details = this.parentElement; 

            details.open = !details.open; 

        }); 

    }); 

}); 

document.addEventListener("DOMContentLoaded", function () { 

    // Zoek alle kleurkiezers en voeg een eventlistener toe 

    document.querySelectorAll(".color-picker").forEach(input => { 

        input.addEventListener("input", function () { 

            let mapId = this.getAttribute("data-map-id"); 

            let kleur = this.value; 

  

            // Zoek de bijbehorende map en pas de kleur aan 

            let mapElement = document.getElementById(`map-${mapId}`); 

            if (mapElement) { 

                mapElement.style.backgroundColor = kleur; 

            } 

  

            // Optioneel: Opslaan in LocalStorage 

            localStorage.setItem(`mapColor-${mapId}`, kleur); 

        }); 

    }); 

  

    // Bij het laden: kleuren herstellen uit LocalStorage 

    document.querySelectorAll(".color-picker").forEach(input => { 

        let mapId = input.getAttribute("data-map-id"); 

        let opgeslagenKleur = localStorage.getItem(`mapColor-${mapId}`); 

        if (opgeslagenKleur) { 

            input.value = opgeslagenKleur; 

            let mapElement = document.getElementById(`map-${mapId}`); 

            if (mapElement) { 

                mapElement.style.backgroundColor = opgeslagenKleur; 

            } 

        } 

    }); 

}); 