const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const BLACK_CARDS_API = "https://restagainsthumanity.com/api/v2/packs/CAH Base Set";
const WHITE_CARDS_API = "https://restagainsthumanity.com/api/v2/packs/CAH Base Set";

let blackCards = [];
let whiteCards = [];

async function loadCards() {
  try {
    const blackResponse = await fetch(BLACK_CARDS_API);
    const whiteResponse = await fetch(WHITE_CARDS_API);

    if (!blackResponse.ok || !whiteResponse.ok) {
      throw new Error("Failed to fetch cards");
    }

    const blackData = await blackResponse.json();
    const whiteData = await whiteResponse.json();

    blackCards = blackData.blackCards;
    whiteCards = whiteData.whiteCards;

    console.log(`Loaded ${blackCards.length} black cards and ${whiteCards.length} white cards.`);
  } catch (err) {
    console.error("Error loading cards:", err);
  }
}

loadCards();

let rooms = new Map();

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("createRoom", (roomId) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], submissions: new Map() });
      console.log(`Room ${roomId} created`);
    }
    socket.join(roomId);
  });

  socket.on("joinRoom", (roomId) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], submissions: new Map() });
    }
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
  });

  socket.on("startGame", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const blackCard = blackCards[Math.floor(Math.random() * blackCards.length)];
    room.blackCard = blackCard;

    io.to(roomId).emit("startGame", { blackCard, whiteCards });
    console.log(`Game started in room ${roomId}, black card: ${blackCard.text}`);
  });

  socket.on("cardSelected", (text, roomId, playerId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.submissions.set(playerId, text);
    io.to(roomId).emit("cardSelected", text, playerId);
    console.log(`Card selected in room ${roomId} by player ${playerId}: ${text}`);
  });

  socket.on("revealCards", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    io.to(roomId).emit("revealCards", Array.from(room.submissions.entries()));
    console.log(`Cards revealed in room ${roomId}`);
  });

  socket.on("cardCzarSelected", (playerId, roomId) => {
    io.to(roomId).emit("cardCzarSelected", playerId);
    console.log(`Card Czar selected in room ${roomId}: ${playerId}`);
    setTimeout(() => {
      io.to(roomId).emit("dealCards", whiteCards);
      console.log(`Dealing new cards in room ${roomId}`);
    }, 2000);

    setTimeout(() => {
      io.to(roomId).emit("newRound");
      console.log(`Starting new round in room ${roomId}`);
    }, 4000);
  });

  socket.on("winnerSelected", (winnerId, roomId) => {
    io.to(roomId).emit("winnerSelected", winnerId);
    console.log(`Winner selected in room ${roomId}: ${winnerId}`);
  });
});

const port = 4040;
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
