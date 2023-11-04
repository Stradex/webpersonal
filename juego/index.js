let serverPacketIntervalID = null;

function clickHostServer() {
    if (!UI_UserNameInput()) {
        return false;
    }
    
    document.querySelector("#ui_game").classList.add("hidden");
    document.querySelector("#ui_main_menu").classList.add("hidden");
    document.querySelector("#ui_wait_clients").classList.remove("hidden");
    document.querySelector("#ui_join_server").classList.add("hidden");
    document.querySelector("#ui_lobby").classList.add("hidden");
    if (navigator.clipboard) {
        document.querySelector("#copy_clipboard_btn").classList.remove("hidden");
    } else {
        document.querySelector("#copy_clipboard_btn").classList.add("hidden");
    }
    UI_updateServerID();
    netSetUserName(UI_UserNameInput());
    netStartServer();
    netServerOnClientConnect(clientConnectedToServer);
    netServerOnClientDisconnect(clientConnectedToServer); //FIXME D:

    return true;
}

function UI_UserNameInput() {
    return document.querySelector("#user_name").value.trim();
}

function UI_RoomToJoinID() {
    return document.querySelector("#client_room_id").value.trim();
}

function UI_updateServerID() {
    document.querySelector("#server_room_id").innerText = peer.id;
}

function UI_refreshUsersList() {
    let usersLists = netGetUsersList();
    let lobbyStr = "";
    usersLists.forEach(user => {
        if (user.server) {
            lobbyStr += "[HOST] ";
        }
        lobbyStr += user.name + "<br />";
    });
    document.querySelector("#room_lobby").innerHTML = lobbyStr;
    document.querySelector("#game_users_list").innerHTML = lobbyStr;
}

function copyServerID() {
    navigator.clipboard.writeText(peer.id);
}

function clickConnect() {
    if (!UI_RoomToJoinID()) {
        return false;
    }
    let clientConn = netConnectToPeer(UI_RoomToJoinID());

    clientConn.on('open', function() {
        goToLobby();
        netClientOnDataReceived(clientProcessServerEvent);
    });
}

function clientProcessServerEvent(eventData) {
    if (!eventData.event) {
        return;
    }
    switch(eventData.event) {
        case "USERS_LIST":
            netSetUsersList(eventData.data);
            UI_refreshUsersList();
        break;
        case "START_GAME":
            startGame();
        break;
    }
}

function clientConnectedToServer() {
    UI_refreshUsersList();
    goToLobby();

    if (netIsUserServer()) {
        if (serverPacketIntervalID) {
            clearInterval(serverPacketIntervalID);
            serverPacketIntervalID = null;
        }
        serverPacketIntervalID = setInterval(() => {
            serverSendUserList();
        }, 2000);
    }
}

function goToLobby() {
    document.querySelector("#ui_game").classList.add("hidden");
    document.querySelector("#ui_main_menu").classList.add("hidden");
    document.querySelector("#ui_wait_clients").classList.add("hidden");
    document.querySelector("#ui_join_server").classList.add("hidden");
    document.querySelector("#ui_lobby").classList.remove("hidden");
}

function clickJoinServer() {
    if (!UI_UserNameInput()) {
        return false;
    }

    document.querySelector("#ui_main_menu").classList.add("hidden");
    document.querySelector("#ui_wait_clients").classList.add("hidden");
    document.querySelector("#ui_join_server").classList.remove("hidden");
    document.querySelector("#ui_lobby").classList.add("hidden");
    document.querySelector("#ui_game").classList.add("hidden");
    netSetUserName(UI_UserNameInput());
    netSetUserClient();

    return true;
}

function clickQuitToMainMenu() {
    document.querySelector("#ui_main_menu").classList.remove("hidden");
    document.querySelector("#ui_wait_clients").classList.add("hidden");
    document.querySelector("#ui_join_server").classList.add("hidden");
    document.querySelector("#ui_lobby").classList.add("hidden");
    document.querySelector("#ui_game").classList.add("hidden");

    netKillServer();
}

function serverStartGame() {
    if (!netIsUserServer()) {
        return;
    }

    serverSendStartGame();
    startGame();
}

function startGame() {
    document.querySelector("#ui_main_menu").classList.add("hidden");
    document.querySelector("#ui_wait_clients").classList.add("hidden");
    document.querySelector("#ui_join_server").classList.add("hidden");
    document.querySelector("#ui_lobby").classList.add("hidden");
    document.querySelector("#ui_game").classList.remove("hidden");
}