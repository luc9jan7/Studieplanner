document.addEventListener('DOMContentLoaded', loadTasksFromLocalStorage);
document.addEventListener('DOMContentLoaded', loadFoldersFromLocalStorage);


let totalTasks = 0;
let completedTasks = 0;
let activeTimers = {}; 

// ✅ Mappen laden vanuit localStorage
function loadFoldersFromLocalStorage() {
    const storedFolders = JSON.parse(localStorage.getItem('folders')) || [];
    const folderList = document.getElementById('folder-list');
    const taskFolderSelect = document.getElementById('task-folder');

    // Leeg de lijst van mappen
    folderList.innerHTML = '';
    taskFolderSelect.innerHTML = '<option value="">Selecteer een map</option>';  // Reset de mapkeuze in takenformulier

    // Voeg mappen toe aan de lijst
    storedFolders.forEach(folder => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${folder} 
            <button class="delete-folder-btn" data-folder="${folder}">Verwijder</button>
        `;
        folderList.appendChild(listItem);

        // Voeg de map toe aan de selectielijst voor taken
        const option = document.createElement('option');
        option.value = folder;
        option.textContent = folder;
        taskFolderSelect.appendChild(option);
    });

    // Voeg event listeners toe aan de verwijderknoppen
    document.querySelectorAll('.delete-folder-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const folderToDelete = e.target.getAttribute('data-folder');
            deleteFolder(folderToDelete);
        });
    });
}

function deleteFolder(folderName) {
    let storedFolders = JSON.parse(localStorage.getItem('folders')) || [];
    
    // Filter de map eruit
    storedFolders = storedFolders.filter(folder => folder !== folderName);
    localStorage.setItem('folders', JSON.stringify(storedFolders));

    // Ook alle taken in deze map verwijderen
    let storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    storedTasks = storedTasks.filter(task => task.folder !== folderName);
    localStorage.setItem('tasks', JSON.stringify(storedTasks));

    // UI updaten
    loadFoldersFromLocalStorage();
    loadTasksFromLocalStorage();
}


// ✅ Nieuwe map toevoegen
document.getElementById('folder-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const folderName = document.getElementById('folder-name').value.trim();
    if (!folderName) return;

    // Haal bestaande mappen op uit localStorage
    let storedFolders = JSON.parse(localStorage.getItem('folders')) || [];
    
    // Voeg de nieuwe map toe aan de lijst van mappen
    if (!storedFolders.includes(folderName)) {
        storedFolders.push(folderName);
        localStorage.setItem('folders', JSON.stringify(storedFolders));
    }

    // Herlaad de mappenlijst en de selectielijst voor taken
    loadFoldersFromLocalStorage();
    loadTasksFromLocalStorage();  // Herlaad de takenlijst om de nieuwe map zichtbaar te maken
    e.target.reset();
});



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
    const taskTime = parseInt(document.getElementById('task-time').value, 10);
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

    loadTasksFromLocalStorage();  // Herlaad de takenlijst om de nieuwe taak weer te geven
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
        updateFolderProgress(folder, [task]); // Update de voortgang van de map
        loadTasksFromLocalStorage();

        let userPoints = localStorage.getItem("points") || 0;  // Haal punten op of zet op 0
let badges = JSON.parse(localStorage.getItem("badges")) || [];

// Wanneer een taak wordt voltooid (checkbox verandert)
checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    updateLocalStorage(task);
    updateFolderProgress(folder, [task]); // Update de voortgang van de map
    loadTasksFromLocalStorage();

    // Als de taak is voltooid, voeg dan punten toe
    if (task.completed) {
        const taskPoints = task.time / 60;  // Bijvoorbeeld: 1 minuut = 1 punt
        userPoints += taskPoints;
        localStorage.setItem("points", userPoints);  // Sla de punten op in localStorage

        // Controleer of er een nieuwe badge is vrijgespeeld
        checkBadges(userPoints);
    }
});

// Functie om badges te controleren
function checkBadges(points) {
    if (points >= 50 && !badges.includes("Beginner Badge")) {
        badges.push("Beginner Badge");
        alert("Gefeliciteerd! Je hebt de Beginner Badge verdiend!");
    }
    if (points >= 100 && !badges.includes("Pro Badge")) {
        badges.push("Pro Badge");
        alert("Gefeliciteerd! Je hebt de Pro Badge verdiend!");
    }

    localStorage.setItem("badges", JSON.stringify(badges));  // Sla de badges op in localStorage
}

    });
}


let notificationSound = null;  // Dit maakt de audio globaal beschikbaar


function startTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn) {
    if (activeTimers[task.name]) return;

    if (task.completed) {
        console.log(`Taak ${task.name} is al voltooid, geen timer gestart.`);
        return;
    }

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;

    activeTimers[task.name] = setInterval(() => {
        if (task.remaining <= 0) {
            clearInterval(activeTimers[task.name]);
            delete activeTimers[task.name];
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            task.completed = true;

            // 🔊 Geluid afspelen (audio afspelen)
            if (!notificationSound) {
                notificationSound = new Audio(''); // Als het geluid nog niet is geladen, laad het dan
            }
            notificationSound.play();

            // ✅ Pop-up melding
            showPopup(`⏰Honeeeeyyy je tijd zit er op voor je "${task.name}" taak!⏰`);

            updateFolderProgress(task.folder, [task]);
        } else {
            task.remaining--;
            timerDisplay.textContent = formatTime(task.remaining);
            updateLocalStorage(task);
        }
    }, 1000);
}


// Functie om de pop-up te sluiten
function closePopup() {
    // Stop de audio als die speelt
    if (notificationSound) {
        notificationSound.pause();  // Stop de audio
        notificationSound.currentTime = 0;  // Zet de tijd terug naar het begin
    }

    document.getElementById('popup').style.display = 'none';
}


function closePopup() {
    // Stop de audio als die speelt
    if (notificationSound) {
        notificationSound.pause();  // Stop de audio
        notificationSound.currentTime = 0;  // Zet de tijd terug naar het begin
    }

    // Verberg de pop-up
    document.getElementById('popup').style.display = 'none';
}




// Functie om de pop-up te tonen
function showPopup(message) {
    document.getElementById('popup-message').textContent = message;
    document.getElementById('popup').style.display = 'block';
}

// Functie om de pop-up te sluiten
function closePopup() {
    // Stop de audio als die speelt
    if (notificationSound) {
        notificationSound.pause();  // Stop de audio
        notificationSound.currentTime = 0;  // Zet de tijd terug naar het begin
    }

    // Verberg de pop-up
    document.getElementById('popup').style.display = 'none';
}






// Functie om de pop-up te tonen
function showPopup(message) {
    document.getElementById('popup-message').textContent = message;
    document.getElementById('popup').style.display = 'block';
}

// Functie om de pop-up te sluiten
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}



// Functie om de e-mail te versturen
function sendEmail() {
  fetch('/api/sendEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: 'Studieplanner Herinnering',
      text: 'Je tijd is om!',
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error('Fout bij het verzenden van e-mail:', error));
}

// Timer functie
let timer = 10; // Stel hier je timer in (bijvoorbeeld 10 seconden)
const timerInterval = setInterval(() => {
  if (timer <= 0) {
    clearInterval(timerInterval); // Stop de timer
    sendEmail(); // Verstuur de e-mail wanneer de timer op nul staat
  } else {
    console.log(`Tijd over: ${timer}`);
    timer--;
  }
}, 1000);

// ✅ Taak opslaan in LocalStorage
function updateLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(t => t.name === task.name);
    if (taskIndex > -1) {
        tasks[taskIndex] = task;  // Werk de taak bij, inclusief de 'emailSent' vlag
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// ✅ Taken laden bij pagina-refresh
function loadTasksFromLocalStorage() {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    totalTasks = storedTasks.length;
    completedTasks = storedTasks.filter(task => task.completed).length;

    const groupedTasks = groupTasksByFolder(storedTasks);

    // Log om te zien welke taken we laden
    console.log("Gelezen taken uit localStorage:", storedTasks); 

    // Leeg de huidige weergave
    document.getElementById('task-list').innerHTML = '';

    // Weergeven per map
    for (const folder in groupedTasks) {
        const folderSection = document.createElement('section');
        folderSection.innerHTML = ` 
            <h3>${folder}</h3>
            <div class="progress-container">
                <div class="progress-bar" id="progress-bar-${folder}"></div>
            </div>
            <p id="progress-text-${folder}">0% voltooid</p>
            <ul></ul>`;

        const taskList = folderSection.querySelector('ul');
        groupedTasks[folder].forEach(task => {
            // Zorg ervoor dat de 'emailSent' vlag aanwezig is (indien niet, zet deze op false)
            if (task.emailSent === undefined) {
                task.emailSent = false;
            }

            console.log(`Taak geladen: ${task.name}, Email verzonden: ${task.emailSent}`);

            addTaskToDOM(task, taskList, folder);
        });

        document.getElementById('task-list').appendChild(folderSection);
        updateFolderProgress(folder, groupedTasks[folder]);
    }

    updateProgress();
}

console.log(`Gelezen taak: ${task.name}, Email verzonden: ${task.emailSent}`);







// Functie voor het verzenden van e-mailmelding
function sendEmailNotification(task) {
    fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            subject: `Tiffany Studieplanner: ${task.name}`,
            text: `De tijd voor mijn taak "${task.name}" afgelopen!`
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('E-mail verzonden:', data);
    })
    .catch(error => {
        console.error('Fout bij het verzenden van de e-mail:', error);
    });
}

// Voorbeeld van hoe je deze functie zou kunnen aanroepen
sendEmailNotification('Test', 'Dit is een test');


function pauseTimer(task, startBtn, pauseBtn) {
    clearInterval(activeTimers[task.name]); // Stop de interval
    delete activeTimers[task.name]; // Verwijder de actieve timer

    startBtn.disabled = false; // Zet de startknop weer aan
    pauseBtn.disabled = true; // Zet de pauzeknop uit
}


// ✅ Timer stoppen
function stopTimer(task, timerDisplay, startBtn, pauseBtn, stopBtn) {
    clearInterval(activeTimers[task.name]); // Stop de interval
    delete activeTimers[task.name]; // Verwijder de actieve timer

    task.remaining = task.time; // Reset de resterende tijd naar de oorspronkelijke tijd
    timerDisplay.textContent = formatTime(task.remaining); // Werk de timerweergave bij

    startBtn.disabled = false; // Zet de startknop weer aan
    pauseBtn.disabled = true; // Zet de pauzeknop uit
    stopBtn.disabled = true; // Zet de stopknop uit

    updateLocalStorage(task); // Werk de taak bij in localStorage
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
    completedTasks = JSON.parse(localStorage.getItem('tasks')).filter(task => task.completed).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${Math.round(progress)}% voltooid`;
}

function updateFolderProgress(folder, tasks) {
    const completedInFolder = tasks.filter(task => task.completed).length;
    const totalInFolder = tasks.length;
    const progress = totalInFolder > 0 ? (completedInFolder / totalInFolder) * 100 : 0;

    // Update de voortgangsbalk voor de map
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
// ✅ Functie voor het verzenden van e-mailmelding
function sendEmailNotification(task) {
    // Zorg ervoor dat we de email alleen sturen als de taak op 0 is
    console.log('Verzenden e-mail voor taak:', task.name);

    fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            subject: `Tiffany Studieplanner: ${task.name}`,
            text: `De tijd voor mijn taak "${task.name}" afgelopen!`
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('E-mail succesvol verzonden:', data);
    })
    .catch(error => {
        console.error('Fout bij het verzenden van de e-mail:', error);
    });
}

// ✅ Update de taak in localStorage
function updateLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(t => t.name === task.name);

    console.log(`Taak updaten: ${task.name}, Email verzonden: ${task.emailSent}`); // Log de taak en de emailSent vlag

    if (taskIndex > -1) {
        // Vervang de oude taak door de nieuwe taak met de 'emailSent' vlag
        tasks[taskIndex] = task;
    } else {
        // Voeg de taak toe als deze nog niet bestaat
        tasks.push(task);
    }

    localStorage.setItem('tasks', JSON.stringify(tasks)); // Sla de bijgewerkte taken op
    console.log("Taken opgeslagen in localStorage:", tasks); // Log de opgeslagen taken
}

