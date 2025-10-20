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