// RoomManagement.js

function CreateRoom() {
    const serverName = document.getElementById("serverNameInput").value;
    if (!serverName) {
        alert("Please enter a server name.");
        return;
    }
    emit("createRoom", { roomName: serverName, playerName: localStorage.getItem("playerName") });
    localStorage.setItem("roomName", serverName);
    console.log("Creating room:", serverName);
    setPage("Game");
}

function JoinRoom(roomName) {
    emit("joinRoom", { roomName: roomName, playerName: localStorage.getItem("playerName") });
    localStorage.setItem("roomName", roomName);
    console.log("Joining room:", roomName);
    setPage("Game");
}

function GetRooms() {
    emit("getRooms", {});
}

//PageManager.js

let currentPage = "NameSelector";

function setPage(page) {
    currentPage = page;
    ReRender(currentPage);
    console.log("Page set to:", currentPage);
}

document.addEventListener("DOMContentLoaded", () => {
    ReRender(currentPage);
    console.log("Initial page rendered:", currentPage);
});

//ViewManager.js

function ReRender(Page) {
    switch(Page) {
        case "NameSelector":
            document.body.innerHTML = `
                <h1>Enter Your Name</h1>
                <input type="text" id="nameInput" placeholder="Your name">
                <button id="nameSubmit" onclick="SetName()">Submit</button>
                `
            break;
        case "Lobby":
            document.body.innerHTML = `
                <h1>Lobby</h1>
                <p>Welcome, ${localStorage.getItem("playerName") || "Player"}!</p>
                <div id="CurrentServers"></div>
                <button id="CreateServer" onclick="CreateRoom()">Create Server</button>
                <button id="RefreshServers" onclick="GetRooms()">Refresh Servers</button>
                <input type="text" id="serverNameInput" placeholder="Server Name">
                <br>
                <input type="text" id="nameInput" placeholder="Your name">
                <button id="nameSubmit" onclick="SetName()">Submit</button>
                `
            GetRooms();
            break;
        case "Game":
            document.body.innerHTML = `
                <button id="LeaveRoom" onclick="emit('LeaveRoom', {}); setPage('Lobby'); ">Leave Room</button>
                <h1>Game Room: ${localStorage.getItem("roomName") || "Unknown"}</h1>
                <div id="gameArea">
                <div id="MainGameArea" style="border: 2px solid gray; padding: 10px; margin-bottom: 10px;">
                <div id="blackCard" style="border: 2px solid black; background-color: black; color: white; padding: 10px; margin: 10px 0;">Black Card will appear here</div>
                <div id="PlayedCardsArea" style="margin-bottom: 10px;"></div>
                </div>
                <div id='SubmitDiv'>
                <button id="PlayCard" onclick="PlayCard()">Play Selected Card</button>
                </div>
                <div id="whiteCardsArea"></div>
                </div>
                <div id="Names">
                <li id="PlayersList">Players: </li>
                </div>
                
                `
            break;
    }
}

//NameManager.js

function SetName() {
    const nameInput = document.getElementById("nameInput");
    const playerName = nameInput.value.trim();
    if (playerName) {
        localStorage.setItem("playerName", playerName);
        console.log("Name set to:", playerName);
        setPage("Lobby");
    } else {
        alert("Please enter a valid name.");
    }
}

//SocketManager.js

const socket = io("ws://socket.cahbyben.xyz");

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

//GameManager.js

let MyWhiteCards = [];
let numPlayed = 0;
let cardsPlayed = [];
let currentCzar = "";

function SubmitBlank() {
    if(localStorage.getItem("playerName") === currentCzar) {
        alert("bitch you the czar you cant play a card rn")
        return
    }
    let cardText = document.getElementById("BlankTextInput").value
    if(cardText.trim() === "") {
        alert("You need to add text to play a blank dumbass")
        return
    }
    if(numPlayed < numNeeded) {
            if(cardsPlayed.includes(cardText)) {
                alert("You cannot play the same card twice!")
                document.getElementById("BlankTextInput").value = ""
                return
            }
            numPlayed++;
            cardsPlayed.push(cardText);
            console.log(`Card played (${numPlayed}/${numNeeded}):`, cardText);
            if(numPlayed === numNeeded) {
                emit("PlayCards", { cards: cardsPlayed, room: localStorage.getItem("roomName") });
                MyWhiteCards = MyWhiteCards.filter(c => c !== cardText);
                for(let card of document.getElementsByClassName("alreadyPlayedCard")) {
                    console.log("Played card:", card);
                    card.remove()
                }
                numPlayed = 0;
                cardsPlayed = [];
                document.querySelectorAll("#whiteCard").forEach(c => {c.style.border = "1px solid black"; c.onclick = () => { SelectCard(c.textContent); };
                });
            }
        }
    document.getElementById("BlankTextInput").value = ""
}

function getWhiteCards() {
    return MyWhiteCards;
}

function setWhiteCards(cards) {
    MyWhiteCards = cards;
    console.log("White cards set:", MyWhiteCards.length);
    document.getElementById("whiteCardsArea").innerHTML = "";
    for (let i = 0; i < MyWhiteCards.length; i++) {
        console.log("adding card:", MyWhiteCards[i].text);
        document.getElementById("whiteCardsArea").innerHTML += "<div id='whiteCard' onclick='SelectCard(`" + MyWhiteCards[i].text + "`)'>" + MyWhiteCards[i].text + "</div>";
    }
    return MyWhiteCards;
}

function SelectCard(card) {
    let Cards = document.querySelectorAll("#whiteCard");
    Cards.forEach(c => {
        if (c.textContent === card) {
            c.style.border = "2px solid blue";
            c.classList.toggle("selectedCard");
        } else {
            c.style.border = "1px solid black";
            c.classList.remove("selectedCard");
        }
    });
    console.log("Selected card:", card);
}

function clearWhiteCards() {
    MyWhiteCards = [];
    console.log("White cards cleared.");
    return MyWhiteCards;
}

function addWhiteCard(card) {
    MyWhiteCards.push(card);
    console.log(MyWhiteCards)
    document.getElementById("whiteCardsArea").innerHTML += "<div id='whiteCard' onclick='SelectCard(`" + card.text + "`)'>" + card.text + "</div>"
    console.log("White card added. Total now:", MyWhiteCards.length);
    return MyWhiteCards;
}

function PlayCard() {
    let selected = document.querySelector(".selectedCard");
    if (selected) {
        if (currentCzar === localStorage.getItem("playerName")) {
            emit("SelectWinningCard", { player: selected.classList[1], room: localStorage.getItem("roomName") });
            return
        }
        else {
            if(selected.textContent.includes("___")) {
            let userInput = prompt("This card has a blank. Please enter your custom text:");
            if(userInput) {
                selected.textContent = selected.textContent.replace("___", userInput);
            } else {
                console.log("No input provided for blank card.");
                return;
            }
        }
        let cardText = selected.textContent;
        if(numPlayed < numNeeded) {
            numPlayed++;
            if(cardsPlayed.includes(cardText)) {
                alert("you cannot submit the same card twice")
                numPlayed--
                return
            }
            cardsPlayed.push(cardText);
            selected.style.border = "2px solid green";
            selected.classList.remove("selectedCard");
            selected.classList.add("alreadyPlayedCard");
            selected.onclick = null;
            console.log(`Card played (${numPlayed}/${numNeeded}):`, cardText);
            if(numPlayed === numNeeded) {
                emit("PlayCards", { cards: cardsPlayed, room: localStorage.getItem("roomName") });
                MyWhiteCards = MyWhiteCards.filter(c => c !== cardText);
                for(let card of document.getElementsByClassName("alreadyPlayedCard")) {
                    console.log("Played card:", card);
                    card.remove()
                }
                numPlayed = 0;
                cardsPlayed = [];
                document.querySelectorAll("#whiteCard").forEach(c => {c.style.border = "1px solid black"; c.onclick = () => { SelectCard(c.textContent); };
                });
            }
        }
        }
        selected.remove();
        MyWhiteCards = MyWhiteCards.filter(c => c !== selected.cardText);
    } else {
        console.log("No card selected to play.");
    }
}

function SetBlackCard(card) {
    let blackCardElem = document.getElementById("blackCard");
    if (!blackCardElem) {
        blackCardElem = document.createElement("div");
        blackCardElem.id = "blackCard";
        blackCardElem.style.border = "2px solid black";
        blackCardElem.style.backgroundColor = "black";
        blackCardElem.style.color = "white";
        blackCardElem.style.padding = "10px";
        blackCardElem.style.margin = "10px 0";
        document.getElementById("gameArea").prepend(blackCardElem);
    }
    blackCardElem.textContent = card.text;
    blackCardElem.innerHTML += `<br><em>Pick ${card.pick}</em>`;
    console.log("Black card set:", card);
    numNeeded = card.pick;
}

function SetCzar(czarName) {
    currentCzar = czarName;
    if (czarName === localStorage.getItem("playerName")) {
        document.getElementById("whiteCardsArea").innerHTML += "<div id=\"CzarBlock\" >You are the Czar this round. You cannot play a card.</div>";
    }
    else {
        console.log("Not the Czar, removing CzarBlock if it exists.");
        console.log("new whiteCardsArea HTML:");
        document.getElementById("CzarBlock").remove()
    }
}

function RevealCards() {
    const cards = document.getElementsByClassName("playedCard");
    for (let card of cards) {
        card.style.color = "black";
    }
}

function selectWinningCard(playerName) {
    if (currentCzar !== localStorage.getItem("playerName")) {
        console.log("Only the Czar can select the winning card.");
        return;
    }
    preselected = document.getElementsByClassName("selectedCard") 
    for( let selected of preselected) {
        selected.classList.remove("selectedCard")
    }
    elements = document.getElementsByClassName(playerName)
    for (let elem of elements) {
        elem.style.border = "2px solid blue";
        elem.classList.add("selectedCard")
    }
    console.log("Winning card selected for player:", playerName);
}