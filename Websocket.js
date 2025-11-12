const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Load cards from local JSON
const cardFile = path.join(__dirname, "external", "cards", "cah-all-full.json");
let blackCards = [];
let whiteCards = [];

try {
  const data = JSON.parse(fs.readFileSync(cardFile, "utf8"));
  // data is an array of packs
  data.forEach(pack => {
    if (Array.isArray(pack.black)) blackCards.push(...pack.black);
    if (Array.isArray(pack.white)) whiteCards.push(...pack.white);
  });
  console.log(`Loaded ${blackCards.length} black cards and ${whiteCards.length} white cards.`);
} catch (err) {
  console.error("Failed to load cards from JSON:", err);
}

// Game state
let rooms = new Map();

// Helper to draw random card
function drawRandomCard(deck) {
  return deck[Math.floor(Math.random() * deck.length)];
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    for (let [roomName, room] of rooms) {
      if (room.players.some(p => p.id === socket.id)) {
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.to(roomName).emit("PlayerList", room.players.map(p => p.name));
        console.log(`Player ${socket.id} disconnected from room ${roomName}`);
        if (room.players.length === 0) {
          rooms.delete(roomName);
          console.log(`Room ${roomName} deleted as it became empty.`);
        }
        if (room.owner === socket.id && room.players.length > 0) {
          room.owner = room.players[0].id;
          console.log(`New owner of room ${roomName} is ${room.owner}`);
          socket.to(roomName).emit("newOwner", room.players[0].name);
        }
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });

  socket.on("LeaveRoom", () => {
    for (let [roomName, room] of rooms) {
      if (room.players.some(p => p.id === socket.id)) {
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(roomName);
        socket.to(roomName).emit("PlayerList", room.players.map(p => p.name));
        console.log(`Player ${socket.id} left room ${roomName}`);
        if (room.players.length === 0) {
          rooms.delete(roomName);
          console.log(`Room ${roomName} deleted as it became empty.`);
        }
        if (room.owner === socket.id && room.players.length > 0) {
          room.owner = room.players[0].id;
          console.log(`New owner of room ${roomName} is ${room.players[0].name}(${room.owner})`);
          socket.to(roomName).emit("newOwner", room.players[0].name);
        }
        break;
      }
    }
  });

  socket.on("createRoom", ({ roomName, playerName }) => {
  if (rooms.has(roomName)) {
    socket.emit("errorMessage", "Room already exists.");
    return;
  }

  rooms.set(roomName, {
    owner: socket.id,
    players: [{ id: socket.id, name: playerName, hand: [], points: 0 }],
    maxPlayers: 10,
    czarIndex: 0,
    blackCard: drawRandomCard(blackCards),
    whiteDeck: [...whiteCards],
    playedCards: [],
    TimeoutActive: false
  });

  socket.join(roomName);
  socket.emit("roomCreated", playerName);
  console.log(`Room created: ${roomName} by ${playerName}`);

  const room = rooms.get(roomName);
  const playerList = room.players.map(p => p.name);

  io.to(roomName).emit("PlayerList", playerList);
  console.log(`Playerlist updated in room ${roomName}:`, playerList);
});


socket.on("joinRoom", ({ roomName, playerName }) => {
  const room = rooms.get(roomName);
  if (!room) {
    socket.emit("errorMessage", "Room does not exist.");
    return;
  }

  room.players.push({ id: socket.id, name: playerName, hand: [] });
  socket.join(roomName);
  console.log(`${playerName} joined room: ${roomName}`);

  const playerList = room.players.map(p => p.name);

  io.to(roomName).emit("PlayerList", playerList);
  console.log(`Playerlist updated in room ${roomName}:`, playerList);
});

  socket.on("getRooms", () => {
    
    data = [];
    for (let [roomName, room] of rooms) {
      let playernumber = 0;
      room.players.forEach(p => {
        playernumber++;
        if (p.id === room.owner) {
          owner = p.name;
        }
      });
      data.push({ roomName: roomName, owner: owner, players: playernumber, maxPlayers: room.maxPlayers });
    }
    console.log(data[0]);
    socket.emit("AvailableRooms", data);
  });

  socket.on("setMaxPlayers", ({ room, maxPlayers }) => {
    const currentRoom = rooms.get(room);
    if (currentRoom && currentRoom.owner === socket.id) {
      currentRoom.maxPlayers = maxPlayers;
      console.log(`Max players for room ${room} set to ${maxPlayers}`);
    }
  });

  socket.on("RequestStartGame", (data) => {
    const roomName = data.room;
    const room = rooms.get(roomName);
    console.log(`Start game requested in room ${roomName} by ${socket.id}`);
    if (!room) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }
    if (room.owner !== socket.id) {
      socket.emit("errorMessage", "Only the room owner can start the game.");
      return;
    }
    if (room.players.length < 4) {
      socket.emit("errorMessage", "At least 4 players are required to start the game.");
      return;
    }
    if (room.players.length > room.maxPlayers) {
      socket.emit("errorMessage", `Cannot start game. Max players is ${room.maxPlayers}.`);
      return;
    }
    if (room.BlanksEnabled === undefined) {
      room.BlanksEnabled = false; // Default to false if not set
    }
    if (room.BlanksEnabled) {
      io.to(roomName).emit("BlanksEnabled", true);
      console.log("Blanks are enabled for this game.");
    }
    room.players.forEach(player => {
      while (player.hand.length < 10) {
        const card = drawRandomCard(room.whiteDeck);
        player.hand.push(card);
      }
      io.to(player.id).emit("WhiteCards", player.hand);
    });

    io.to(roomName).emit("BlackCard", room.blackCard);
    io.to(roomName).emit("Czar", room.players[room.czarIndex].name);
    console.log(`Game started in room ${roomName}`);
  });

  socket.on("PlayCards", ({ cards, room }) => {
    const currentRoom = rooms.get(room);
    if (!currentRoom) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }
    const player = currentRoom.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit("errorMessage", "Player not in room.");
      return;
    }
    currentRoom.playedCards.push({ player: player.name, cards: cards });
    cards.forEach(currcard => {
      console.log(`Removing card from ${player.name}'s hand:`, currcard);
      player.hand = player.hand.filter(c => c.text !== currcard);
      console.log(`${player.hand}`)
      console.log(player.hand.length)
    });
    console.log(`${player.name} played a card in room ${room}: ${cards}`);
    io.to(room).emit("CardPlayed", { player: player.name, cards: cards });
    console.log(`${currentRoom.playedCards.length} cards played, ${currentRoom.players.length - 1} needed.`);
    if (currentRoom.playedCards.length === currentRoom.players.length - 1) {
      io.to(room).emit("AllCardsPlayed");
      console.log(`All cards played in room ${room}. Waiting for Czar to choose.`);
    }
  });
    
  socket.on("SelectWinningCard", ({ player, room }) => {
    const currentRoom = rooms.get(room);
    if(currentRoom.TimeoutActive) {
      console.log("stopped czar from selecting someone multiple times")
      return
    }
    if (!currentRoom) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }
    if (currentRoom.players[currentRoom.czarIndex].id !== socket.id) {
      socket.emit("errorMessage", "Only the Czar can select the winning card.");
      return;
    }
    const winner = currentRoom.players.find(p => p.name === player);
    if (!winner) {
      socket.emit("errorMessage", "Selected player not found.");
      return;
    }
    currentRoom.players.find(p => p.name === player).points = (currentRoom.players.find(p => p.name === player).points || 0) + 1;
    console.log(`Player ${player} now has ${currentRoom.players.find(p => p.name === player).points} points.`);
    if(currentRoom.players.find(p => p.name === player).points >= 20) {
      io.to(room).emit("GameWinner", { player: player});
      return;
    }
    io.to(room).emit("RoundWinner", { player: player});
    room.TimeoutActive = true
    setTimeout(() => {
      currentRoom.czarIndex = (currentRoom.czarIndex + 1) % currentRoom.players.length;
      currentRoom.blackCard = drawRandomCard(blackCards);
      currentRoom.playedCards = [];
      currentRoom.players.forEach(p => {
        console.log(`Player ${p.name} has ${p.hand.length} cards before dealing.`);
        while (p.hand.length < 10) {
          const card = drawRandomCard(currentRoom.whiteDeck);
          io.to(p.id).emit("newWhiteCard", card);
          p.hand.push(card);
          console.log(`Dealt new card (${card}) to ${p.name} in room ${room}`);
        }
      io.to(room).emit("BlackCard", currentRoom.blackCard);
      io.to(room).emit("Czar", currentRoom.players[currentRoom.czarIndex].name);
      io.to(room).emit("NewRound");
      currentRoom.TimeoutActive = false
      console.log(`New round started in room ${room}. Czar is now ${currentRoom.players[currentRoom.czarIndex].name}`);
      
      });
    }, 10000); // 10 second delay before new round
    console.log(`Player ${player} won the round in room ${room}.`);
  });

  socket.on("setBlanksEnabled", ({ room, blanksEnabled }) => {
    const currentRoom = rooms.get(room);
    if (currentRoom && currentRoom.owner === socket.id) {
      currentRoom.BlanksEnabled = blanksEnabled;
      console.log(`Blanks enabled for room ${room} set to ${blanksEnabled}`);
    }
  });

  socket.onAny((event, ...args) => {
    console.log(`Event: ${event}`, args);
  });
  
});

const PORT = 4040;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
