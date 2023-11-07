let peer = null;
let reconnectIntervalID = null;
const STARTING_MONEY=1000;
let netUserData = {
    server: false,
    name: "Sin Nombre",
    conn: null,
    money: STARTING_MONEY
};
let netUsersList = [];
let netUserOnConnectCallback=null;
let netUserReceiveDataCallback=null;
let netUserOnDisconnectCallback = null;

function initPeer() {
    peer = new Peer();
    peer.on('open', function(id) {
        document.querySelector("#peer_id").innerText = id;
        console.log("My peer ID is: " + id);
    });

    peer.on('connection', function(remoteConn) {

        if (reconnectIntervalID) {
            clearInterval(reconnectIntervalID);
            reconnectIntervalID = null;
        }
        if (netIsUserServer()) {
            netAddClient(remoteConn);
        }
        initConn(remoteConn);
    });

    peer.on('call', function(mediaConn) {
        updateConnStatusMsg("CALL", "Remote Peer: " + conn.peer);
    });

    peer.on('disconnected', function() {
        updateConnStatusMsg("DISCONNECTED", "");
        if (!reconnectIntervalID) {
            reconnectIntervalID = setInterval(() => {
                updateConnStatusMsg("RECONNECTING", "");
                peer.reconnect();
            }, 1000);
        }
    });

    peer.on('error', function(err) {
        updateConnStatusMsg("ERROR", err.type);
    });
}

function initConn(conn) {
    conn.on('open', function() {
        conn.on('data', function(data) {
            updateDataReceived(data);
            if (netUserReceiveDataCallback) {
                netUserReceiveDataCallback(data);
            }
            //console.log("Received: ", data);
        });
        conn.on('close', function() {
            updateConnStatusMsg("CONN CLOSED", "Remote Peer: " + conn.peer);
            removeClient(conn);
        });
        if (netIsUserServer() && netUserOnConnectCallback) {
            netUserOnConnectCallback();
        }
        conn.on('error', function(err) {
            updateConnStatusMsg("CONN ERROR", err);
            removeClient(conn);
        });

        updateConnStatusMsg("CONNECTED", "Remote Peer: " + conn.peer);
    });
}

function netStartServer() {
    netSetUserServer();
    netUsersList = [];
    netUsersList.push(netUserData); //Add HOST always as first client.
}

function removeClient(clientConn) {
    if (!netIsUserServer()) {  //SERVER-SIDE ONLY
        return false;
    }
    netUsersList = netUsersList.filter(netUser => netUser.name !== clientConn.label);
    netUserOnDisconnectCallback();
    return true;
}

function netAddClient(clientConn) {
    if (!netIsUserServer()) {  //SERVER-SIDE ONLY
        return false;
    }
    if (netClientExists(clientConn)) {
        return false;
    }
    netUsersList.push({
        server: false,
        name: clientConn.label,
        conn: clientConn,
        money: STARTING_MONEY
    });

    updateConnStatusMsg("ADD CLIENT", netUsersList[netUsersList.length-1].name);
    return true;
}

function netClientExists(clientConn) {
    for (let i=0; i < netUsersList.length; i++) {
        if (netUsersList[i].name == clientConn.label) {
            return true;
        }
    }
    return false;
}

function serverSendUserList() {
    return serverSendNetEvent("USERS_LIST", netUsersList.map(({conn, ...keepAttrs}) => keepAttrs));
}
function serverSendStartGame() {
    return serverSendNetEvent("START_GAME", null);
}

function serverSendNetEvent(event_name, event_data) {
    if (!netIsUserServer()) { //SERVER-SIDE ONLY
        return false;
    }
    //Maybe I should store ALL clients Connection Data.
    netUsersList.forEach(netUser => {
        console.log(netUser);
        if (netUser.conn) {
            netUser.conn.send({
                event: event_name,
                data: event_data
            });
        }
    });

    return true;
}

function netSetUserServer() {
    netUserData.server = true;
}
function netSetUserClient() {
    netUserData.server = false;
}
function netIsUserServer() {
    return netUserData.server;
}
function netIsUserClient() {
    return !netIsUserServer();
}
function netSetUserName(newUserName) {
    netUserData.name = newUserName;
}
function netKillServer() {
    peer.destroy();
    netSetUserClient();
    initPeer();
}

function netGetUsersList() {
    return netUsersList;
}

function netSetUsersList(newUsersList) {
    netUsersList = newUsersList;
}

function netServerOnClientConnect(callback) {
    netUserOnConnectCallback = callback;
}

function netClientOnDataReceived(callback) {
    netUserReceiveDataCallback = callback;
}

function netServerOnClientDisconnect(callback) {
    netUserOnDisconnectCallback = callback;
}

//DEBUG ONLY
function netConnectToPeer(peer_id) {
    let tmpConn = peer.connect(peer_id, {label: netUserData.name});
    initConn(tmpConn);
    updateConnStatusMsg("CONNECTING", "Peer ID: " + peer_id);

    return tmpConn;
}

function onPressConnectToPeer() {
    netConnectToPeer(document.querySelector("#server_peer_id").value);
}

function updateDataReceived(data) {
    document.querySelector("#data_received").innerText = data;
}

function updateConnStatusMsg(status, message) {
    document.querySelector("#conn_status").innerText = "[" + status + "]: " + message;
}


initPeer();