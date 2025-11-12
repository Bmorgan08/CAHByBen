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