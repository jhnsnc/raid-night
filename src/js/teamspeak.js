//variables
var teamspeak;
var serverInfo = {}; //object: {serverId, serverName, serverAddress, channelId, channelName, userId, userName}
var channelMembers = []; //array of objects with TS client IDs and TS client names
var talkingMembers = []; //array of TS client IDs
var connectionStatus = ''; //string: "disconnected", "initializing", "connecting", "configuring", "connected", "failed", "refreshing"

//functions - storage

function storeServerInfo() {
	window.localStorage.setItem('rn.ts.serverInfo', JSON.stringify(serverInfo));
}

function storeChannelMembers() {
	window.localStorage.setItem('rn.ts.channelMembers', JSON.stringify(channelMembers));
	handleChannelMembers(JSON.stringify(channelMembers)); //TODO: handle this without dependencies on active-members.js
}

function storeTalkingMembers() {
	window.localStorage.setItem('rn.ts.talkingMembers', JSON.stringify(talkingMembers));
}

function storeConnectionStatus() {
	window.localStorage.setItem('rn.ts.connectionStatus', connectionStatus);
}

function handleTeamspeakStorage(evt) {
	switch (evt.key) {
		case 'rn.ts.pendingMessages':
			handlePendingMessages(evt.newValue);
			break;
		case 'rn.ts.connectionStatus':
			handleConnectionStatus(evt.newValue);
			break;
		default:
			break;
	}
}

function handlePendingMessages(json) {
	//send messages
	var arr = JSON.parse(json);
	if (arr && arr.length) {
		sendTextMessages( arr );
	}
	//clear pending messages
	window.localStorage.setItem('rn.ts.pendingMessages', JSON.stringify([]));
}
function handleConnectionStatus(status) {
	if (status == "refreshing") {
		connectToServer();
	}
}

//functions - event handlers

function handleServerConnection(err, res) {
	//handle error
	if (!err.success) {
		setStatus("failed");
		console.log("Error connecting to TS server: " + err.errorCode);
		console.log(err.error);
		return;
	}
	//handle response
	if (res && typeof res.activeServerId !== 'undefined')  {
		console.log("Processing TS connection");
		serverInfo = { serverId: res.activeServerId };
		//next step
		getServerInfo();
	} else {
		console.log("Error processing TS connection");
		setStatus("failed");
	}
}

function handleServerInfo(err, res) {
	//handle error
	if (!err.success) {
		setStatus("failed");
		console.log("Error retrieving TS server info: " + err.errorCode);
		console.log(err.error);
		return;
	}
	//handle response
	if (res 
		&& typeof res.serverId !== 'undefined' 
		&& typeof res.nickName !== 'undefined' 
		&& typeof res.host !== 'undefined' 
		&& typeof res.port !== 'undefined' 
		&& typeof res.channelId !== 'undefined' 
		&& typeof res.channelName !== 'undefined' 
		&& typeof res.myClientId !== 'undefined' 
		&& typeof res.myClientName !== 'undefined') {
			console.log("Processing TS server info");
			serverInfo = {
				serverId: res.serverId, 
				serverName: res.nickName, 
				serverAddress: res.host + ':' + res.port, 
				channelId: res.channelId, 
				channelName: res.channelName, 
				userId: res.myClientId, 
				userName: res.myClientName
			};
			//next step
			storeServerInfo();
			getChannelMembers();
	} else {
		console.log("Error processing TS server info");
		setStatus("failed");
	}
}

function handleMemberList(err, res) {
	//handle error
	if (!err.success) {
		setStatus("failed");
		console.log("Error retrieving user info for current channel: " + err.errorCode);
		console.log(err.error);
		return;
	}
	//handle response
	if (res && res.length 
		&& res.length > 0 
		&& typeof res[0].clientId !== 'undefined' 
		&& typeof res[0].nickname !== 'undefined' 
		&& typeof res[0].isTalking !== 'undefined' ) {
			console.log("Processing user info for current channel");
			var i, len;
			channelMembers = [];
			talkingMembers = [];

			for (i = 0, len = res.length; i < len; i += 1) {
				channelMembers.push({
					id: res[i].clientId,
					name: res[i].nickname
				});
				if (res[i].isTalking) {
					talkingMembers.push(res[i].clientId);
				}
			}
			//next step
			storeChannelMembers();
			storeTalkingMembers();
			setStatus("connected");
	} else {
		console.log("Error processing user info for current channel");
		setStatus("failed");
	}
}

function handleTextMessageResponse(err, res) {
	//handle error
	if (!err.success) {
		console.log("Error sending message to TS server: " + err.errorCode);
		console.log(err.error);
		return;
	} else {
		console.log("Message sent successfully");
	}
}

//TODO: add other event handlers
function handleActiveServerChanged(id) {
	console.log("Handling active server changed");
	if (id !== serverInfo.serverId) {
		serverInfo = {serverId: id};
		connectToServer();
	}
}
function handleChannelUpdated(channel) {
	console.log("Handling channel update");
	if (channel.channelId === serverInfo.channelId) {
		if (channel.channelName !== serverInfo.channelName) {
			serverInfo.channelName = channel.channelName;
			storeServerInfo();
		}
	}
}
function handleClientEvent(evt) {
	console.log("Handling client event");
	if (evt.isOwnClient) {
		getServerInfo(true);
	} else {
		//leaving channel
		if (evt.channelId === serverInfo.channelId) {
			removeFromChannelMembers(evt.clientId);
			storeChannelMembers();
		}
		//entering channel
		if (evt.newChannelId === serverInfo.channelId) {
			addToChannelMembers(evt.clientId, evt.clientName);
			storeChannelMembers();
		}
	}
}
function handleClientUpdated(evt) {
	console.log("Handling client updated");
	updateChannelMembersMember(evt.clinetId, evt.nickname, evt.isTalking);
}
function handleTalkStatusChanged(evt) {
	console.log("Handling client talk status");
	if (evt.state === 'Talk') {
		addToTalkingMembers(evt.clientId);
		storeTalkingMembers();
	} else if (evt.state === 'StopTalk') {
		removeFromTalkingMembers(evt.clientId);
		storeTalkingMembers();
	}
}

//functions - server tasks

function connectToServer() {
	setStatus("intializing");
	teamspeak.init({ 
		name: "RaidNight Overwolf App" 
	}, handleServerConnection);
}

function getServerInfo(statusSilent) {
	if (!statusSilent) {
		setStatus("connecting");
	}
	teamspeak.getServerInfo(serverInfo.serverId, handleServerInfo);
}

function getChannelMembers() {
	setStatus("configuring");
	teamspeak.getChannelClientList({ 
		serverId: serverInfo.serverId, 
		channelId: serverInfo.channelId 
	}, handleMemberList);
}

function sendTextMessages(msg) {
	//can accept one message or an array of messages
	//note: link messages should be wrapped in [URL][/URL] to display properly
	if (typeof msg === 'undefined') {
		console.log("Error sending message to TS server");
		return;
	}
	if (typeof msg === 'string') {
		teamspeak.sendTextMessage({
			serverId: serverInfo.serverId, 
			type: 'Channel', 
			targetId: serverInfo.channelId, 
			message: msg
		}, handleTextMessageResponse);
	} else if (typeof msg.length !== 'undefined') {
		var i, len;
		for (i = 0, len = msg.length; i < len; i += 1) {
			teamspeak.sendTextMessage({
				serverId: serverInfo.serverId, 
				type: 'Channel', 
				targetId: serverInfo.channelId, 
				message: msg[i]
			}, handleTextMessageResponse);
		}
	}
}

function setStatus(status) {
	connectionStatus = status;
	storeConnectionStatus();
}

function removeFromChannelMembers(id) {
	var i, len;
	for (i = 0, len = channelMembers.length; i < len; i += 1) {
		if (channelMembers[i].id === id) {
			console.log("Removing " + channelMembers[i].name + " from list of channel members");
			channelMembers.splice(i, 1);
			removeFromTalkingMembers(id);
			break;
		}
	}
}
function removeFromTalkingMembers(id) {
	var i;
	i = talkingMembers.indexOf(id);
	if (i !== -1) {
		// console.log("Removing member (id=" + id + ") from list of talking members");
		talkingMembers.splice(i, 1);
	}
}
function addToChannelMembers(id, name) {
	var i, len;
	var containsMember = false;
	for (i = 0, len = channelMembers.length; i < len; i += 1) {
		if (channelMembers[i].id === id) {
			containsMember = true;
			break;
		}
	}

	if (!containsMember) {
		console.log("Adding " + name + " to list of channel members");
		channelMembers.push({id: id, name: name});
	}
}
function addToTalkingMembers(id) {
	if (talkingMembers.indexOf(id) === -1) {
		// console.log("Adding member (id=" + id + ") to list of talking members");
		talkingMembers.push(id);
	}
}
function updateChannelMembersMember(id, name, isTalking) {
	var i, len;
	for (i = 0, len = channelMembers.length; i < len; i += 1) {
		if (channelMembers[i].id === id) {
			console.log("Updating " + channelMembers[i].name + " from list of channel members (to " + name + ")");
			channelMembers[i].name = name;
			if (isTalking) {
				addToTalkingMembers(id);
			} else {
				removeFromTalkingMembers(id);
			}
			storeChannelMembers();
			storeTalkingMembers();
			break;
		}
	}
}


//init
(function init() {
    console.log("TEAMSPEAK.JS INIT");
	
	//TS Plugin config
	teamspeak = document.getElementById('tsPlugin');
	setStatus("disconnected");

	//TS events
	//TODO: bind events to handlers
	//onDisconnectedFromClient
	//onServerStatusChange and/or 
	teamspeak.addEventListener("onActiveServerChanged", handleActiveServerChanged);
	teamspeak.addEventListener("onChannelUpdated", handleChannelUpdated);
	teamspeak.addEventListener("onClientEvent", handleClientEvent);
	teamspeak.addEventListener("onClientUpdated", handleClientUpdated);
	teamspeak.addEventListener("onTalkStatusChanged", handleTalkStatusChanged);

	//storage
	window.addEventListener('storage', handleTeamspeakStorage, false);

	//auto-connect
	if (JSON.parse(window.localStorage.getItem('rn.settings.tsAutoConnect'))) {
		connectToServer();
	}
}());
