const socket = io("https://zvq1cx6j-4040.uks1.devtunnels.ms/");

function emit(event, data) {
    socket.emit(event, data);
}

socket.on("AvailableRooms", (data) => {
    document.getElementById("CurrentServers").innerHTML = "";
    for (let i = 0; i < data.length; i++) {
        console.log("Room:", data[i]);
        const roomDiv = document.createElement("div");
        roomDiv.id = "room";
        roomDiv.innerHTML = `
            <h3>${data[i].roomName}</h3>
            <p>Owner: ${data[i].owner}</p>
            <p>Players: ${data[i].players} / ${data[i].maxPlayers}</p>
            <button onclick="JoinRoom('${data[i].roomName}')">Join Room</button>
        `;
        document.getElementById("CurrentServers").appendChild(roomDiv);
    }
});

socket.on("PlayerList", (List) => {
    console.log("Player list updated:", List);
    document.getElementById("PlayersList").innerHTML = "Players: ";
    for (let i = 0; i < List.length; i++) {
        const playerItem = document.createElement("li");
        playerItem.textContent = List[i];
        playerItem.classList.add(`${List[i]}Name`)
        scoreCounter = document.createElement("span");
        scoreCounter.id = `score`;
        scoreCounter.textContent = " (0)";
        playerItem.appendChild(scoreCounter);
        document.getElementById("PlayersList").appendChild(playerItem);
    }
});

socket.on("roomCreated", (ownerName) => {
    if (ownerName === localStorage.getItem("playerName")) {
        console.log("You are the room owner.");
        button = "<button id='StartGame' onclick='emit(\"RequestStartGame\", { room: localStorage.getItem(\"roomName\") });'>Start Game</button>";
        numPlayer = document.createElement("label")
        numPlayer.textContent = "Number of players:";
        input = "<input id=\"maxPlayersInput\" type=\"number\" min=\"4\" max=\"20\" value=\"10\" onchange='let val = parseInt(this.value); if(isNaN(val) || val < 4) val = 4; if(val > 20) val = 20; this.value = val; emit(\"setMaxPlayers\", { room: localStorage.getItem(\"roomName\") ,maxPlayers: val });'>"
        numPlayer.innerHTML += input;
        check = document.createElement("label");
        check.textContent = "Blanks enabled";
        checkbox = "<input type='checkbox' id='blanksEnabled' onchange='emit(\"setBlanksEnabled\", { room: localStorage.getItem(\"roomName\") ,blanksEnabled: this.checked });'>";
        check.innerHTML += checkbox;
        document.getElementById("gameArea").appendChild(check);
        document.getElementById("gameArea").appendChild(document.createElement("br"));
        document.getElementById("gameArea").appendChild(numPlayer);
        document.getElementById("gameArea").appendChild(document.createElement("br"));
        document.getElementById("gameArea").innerHTML += button;
    }
});

socket.on("newOwner", (ownerName) => {
    console.log("New room owner is:", ownerName);
    if (ownerName === localStorage.getItem("playerName")) {
        console.log("You are the room owner.");
        button = "<button id='StartGame' onclick='emit(\"RequestStartGame\", { room: localStorage.getItem(\"roomName\") });'>Start Game</button>";
        numPlayer = document.createElement("label")
        numPlayer.textContent = "Number of players:";
        input = "<input id=\"maxPlayersInput\" type=\"number\" min=\"4\" max=\"20\" value=\"10\" onchange='let val = parseInt(this.value); if(isNaN(val) || val < 4) val = 4; if(val > 20) val = 20; this.value = val; emit(\"setMaxPlayers\", { room: localStorage.getItem(\"roomName\") ,maxPlayers: val });'>"
        numPlayer.appendChild(input);
        check = document.createElement("label");
        check.textContent = "Blanks enabled";
        checkbox = "<input type='checkbox' id='blanksEnabled' onchange='emit(\"setBlanksEnabled\", { room: localStorage.getItem(\"roomName\") ,blanksEnabled: this.checked });'>";
        check.innerHTML += checkbox;
        document.getElementById("gameArea").appendChild(check);
        document.getElementById("gameArea").appendChild(document.createElement("br"));
        document.getElementById("gameArea").appendChild(numPlayer);
        document.getElementById("gameArea").appendChild(document.createElement("br"));
        document.getElementById("gameArea").innerHTML += button;
    }
});

socket.on("WhiteCards", (cards) => {
    console.log("Received white cards:", cards);
    setWhiteCards(cards);
});

socket.on("newWhiteCard", (card) => {
    console.log("Received new white card:", card);
    addWhiteCard(card);
});

socket.on("BlackCard", (card) => {
    console.log("Received black card:", card);
    SetBlackCard(card);
});

socket.on("Czar", (czarName) => {
    console.log("Received czar name:", czarName);
    SetCzar(czarName);
});

socket.on("errorMessage", (msg) => {
    alert(msg);
    console.error("Error from server:", msg);
    setPage("Lobby");
});

socket.on("CardPlayed", (data) => {
    console.log(`Player ${data.player} played a card.`);
    const playedCardsArea = document.getElementById("PlayedCardsArea");

    // Use data.cards instead of cards (undefined in your code)
    if (data.cards && data.cards.length > 1) {
        // Create a container for the played cards
        const playedCardContainer = document.createElement("div");
        playedCardContainer.onclick = () => {
            selectWinningCard(data.player);
        }
        playedCardContainer.classList.add("playedCardContainer"); // Use class instead of id for multiple
        playedCardsArea.appendChild(playedCardContainer);

        data.cards.forEach((card) => {
            const cardElem = document.createElement("div");
            cardElem.classList.add("playedCard", `${data.player}`); 
            cardElem.textContent = card;
            if(data.player === localStorage.getItem("playerName")) {
                console.log("It's your card, setting text color to black.");
                cardElem.style.color = "black"
            }
            else {
                console.log("It's not your card, setting text color to white.");
                cardElem.style.color = "white"
            }
            playedCardContainer.appendChild(cardElem);
            
        });
    }
    else if (data.cards && data.cards.length === 1) {
        const cardElem = document.createElement("div");
        cardElem.classList.add("playedCard", `${data.player}`); 
        cardElem.textContent = data.cards[0];  
        cardElem.onclick = () => {
            selectWinningCard(data.player);
        }
        if(data.player === localStorage.getItem("playerName")) {
            console.log("It's your card, setting text color to black.");
            cardElem.style.color = "black"
        }
        else {
            console.log("It's not your card, setting text color to white.");
            cardElem.style.color = "white"
        }
        playedCardsArea.appendChild(cardElem);
    }    
});

socket.on("AllCardsPlayed", () => {
    console.log("All cards have been played. Czar is choosing the winner.");
    RevealCards();
});

socket.on("RoundWinner", ({ player }) => {
    document.getElementsByClassName(`${player}`)[0].style.border = "2px solid gold";
    document.getElementsByClassName(`${player}Name`)[0].querySelector("#score").textContent = ` (${parseInt(document.getElementsByClassName(`${player}Name`)[0].querySelector("#score").textContent.slice(2)) + 1})`;
});

socket.on("GameWinner", ({ player }) => {
    alert(`Player ${player} has won the game! Returning to lobby.`);
});

socket.on("NewRound", () => {
    document.getElementById("PlayedCardsArea").innerHTML = "";
    numPlayed = 0;
    cardsPlayed = [];
    document.querySelectorAll("#whiteCard").forEach(c => {c.style.border = "1px solid black"; c.onclick = () => { SelectCard(c.textContent)}});
});

socket.on("BlanksEnabled", () => {
    console.log("hiiiiii")
    const BlankText = "<input type='text' id='BlankTextInput' placeholder='Enter text for Blank card'> "
    document.getElementById("SubmitDiv").innerHTML += BlankText;
    console.log("added button")
    const BlankButton = "<button id='BlankButton' onclick='SubmitBlank()'>Submit!</button>"
    document.getElementById("SubmitDiv").innerHTML += BlankButton;
    console.log(document.getElementById("SubmitDiv").innerHTML)
    console.log("added input")
});


socket.onAny((event, ...args) => {
    console.log(`Event: ${event}`, args);
});