import * as GameManager from './GameManager.js';
import * as NameManager from './NameManager.js';
import * as PageManager from './PageManager.js';
import * as RoomManagement from './RoomManagement.js';
import * as SocketManager from './SocketManager.js';
import * as ViewManager from './ViewManager.js';

window.SetName = NameManager.SetName
window.CreateRoom = RoomManagement.CreateRoom
window.GetRooms = RoomManagement.GetRooms
window.emit = SocketManager.emit
window.setPage = PageManager.setPage
window.PlayCard = GameManager.PlayCard