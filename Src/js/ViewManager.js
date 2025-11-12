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
                <li id="PlayersList">Players: </li>
                
                `
            break;
    }
}