const socket = io();
let currentLobbyId = null;
let isHost = false;

function createLobby() {
    const settings = {
        startChips: parseInt(document.getElementById("startChips").value),
        smallBlind: parseInt(document.getElementById("smallBlind").value),
        bigBlind: parseInt(document.getElementById("bigBlind").value),
        rounds: parseInt(document.getElementById("rounds").value)
    };

    socket.emit("createLobby", settings, (lobbyId) => {
        currentLobbyId = lobbyId;
        isHost = true;
        showLobby(lobbyId);
    });
}

function joinLobby() {
    const lobbyId = document.getElementById("lobbyIdInput").value;
    socket.emit("joinLobby", lobbyId, (success) => {
        if (success) {
            currentLobbyId = lobbyId;
            showLobby(lobbyId);
        } else {
            alert("Lobby not found!");
        }
    });
}

function startGame() {
    if (isHost) {
        socket.emit("startGame", currentLobbyId);
    }
}

function showLobby(lobbyId) {
    document.getElementById("lobbyMenu").style.display = "none";
    document.getElementById("lobbyView").style.display = "block";
    document.getElementById("lobbyInfo").innerText = `Lobby ID: ${lobbyId}`;
}

socket.on("lobbyUpdate", (lobby) => {
    let list = document.getElementById("playerList");
    list.innerHTML = "";
    lobby.players.forEach(p => {
        let li = document.createElement("li");
        li.textContent = `${p.id} - Chips: ${p.chips}`;
        list.appendChild(li);
    });
});

socket.on("gameStarted", (data) => {
    document.getElementById("lobbyView").style.display = "none";
    document.getElementById("gameView").style.display = "block";
    document.getElementById("gameInfo").innerText =
        `Game started! Small Blind: ${data.smallBlind}, Big Blind: ${data.bigBlind}`;
});
