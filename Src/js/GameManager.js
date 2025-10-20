let MyWhiteCards = [];
let numPlayed = 0;
let cardsPlayed = [];
let currentCzar = "";

function SubmitBlank() {
    let cardText = document.getElementById("BlankTextInput").value
    if(numPlayed < numNeeded) {
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
    elements = document.getElementsByClassName(playerName)
    for (let elem of elements) {
        elem.style.border = "2px solid blue";
        elem.classList.add("selectedCard")
    }
    console.log("Winning card selected for player:", playerName);
}