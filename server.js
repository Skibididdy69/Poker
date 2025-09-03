const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend från /public
app.use(express.static("public"));

let lobbies = {}; // { lobbyId: { hostId, settings, players: [] } }

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Skapa en lobby
    socket.on("createLobby", (settings, callback) => {
        const lobbyId = Math.random().toString(36).substring(2, 8);
        lobbies[lobbyId] = {
            hostId: socket.id,
            settings,
            players: []
        };
        socket.join(lobbyId);
        lobbies[lobbyId].players.push({ id: socket.id, chips: settings.startChips });
        callback(lobbyId);
        io.to(lobbyId).emit("lobbyUpdate", lobbies[lobbyId]);
    });

    // Gå med i en lobby
    socket.on("joinLobby", (lobbyId, callback) => {
        if (lobbies[lobbyId]) {
            socket.join(lobbyId);
            lobbies[lobbyId].players.push({ id: socket.id, chips: lobbies[lobbyId].settings.startChips });
            callback(true);
            io.to(lobbyId).emit("lobbyUpdate", lobbies[lobbyId]);
        } else {
            callback(false);
        }
    });

    // Starta spelet
    socket.on("startGame", (lobbyId) => {
        const lobby = lobbies[lobbyId];
        if (lobby && socket.id === lobby.hostId) {
            let players = lobby.players;

            if (players.length >= 2) {
                players[0].chips -= lobby.settings.smallBlind;
                players[1].chips -= lobby.settings.bigBlind;
            }

            io.to(lobbyId).emit("gameStarted", {
                players,
                smallBlind: lobby.settings.smallBlind,
                bigBlind: lobby.settings.bigBlind
            });
        }
    });

    // Koppla från
    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);
        for (let lobbyId in lobbies) {
            let lobby = lobbies[lobbyId];
            if (!lobby) continue;

            lobby.players = lobby.players.filter(p => p.id !== socket.id);

            if (lobby.players.length === 0) {
                delete lobbies[lobbyId];
            } else {
                io.to(lobbyId).emit("lobbyUpdate", lobby);
            }
        }
    });
});

// Render använder PORT från env
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
