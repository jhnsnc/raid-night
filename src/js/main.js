//global variables
var $body;

var membersData = [];
var talkingMembers = [];

//functions - event handlers

function handleWindowButton(evt) {
	openWindow(evt.data.name);
}

function handleStorage(evt) {
	switch (evt.key) {
		case 'rn.settings.overlayalign':
			setOverlayAlign(evt.newValue);
			break;
		case 'rn.members':
			updateMembers(evt.newValue);
			break;
		case 'rn.ts.talkingMembers':
			updateTalkingMembers(evt.newValue);
			break;
		default:
			break;
	}
}

//functions - window management

function openWindow(name) {
	overwolf.windows.obtainDeclaredWindow(name, function callbackShowWindow(res) {
		//handle error
		if (res.status !== 'success') {
			console.log("Unable to get window: " + windowName);
			console.log(res);
			return;
		}

		var windowId = res.window.id;
		overwolf.windows.restore(windowId, function onOpen() {});
	});
}

//functions - main view manipulation

function setOverlayAlign(value) {
	if (value == "left") {
		$body.removeClass('rightEdge').addClass('leftEdge');
	} else if (value == "right") {
		$body.removeClass('leftEdge').addClass('rightEdge');
	}
}

function updateMembers(jsonString) {
	console.log("Updating members data");
	var obj = JSON.parse(jsonString);
	Array.prototype.splice.apply(membersData, [0, membersData.length].concat(obj));
	syncTalkingMembers();
}

function updateTalkingMembers(jsonString) {
	console.log("Updating talking members");
	var obj = JSON.parse(jsonString);
	Array.prototype.splice.apply(talkingMembers, [0, talkingMembers.length].concat(obj));
	syncTalkingMembers();
}

function syncTalkingMembers() {
	var i, len;
	for (i = 0, len = membersData.length; i < len; i += 1) {
		if (membersData[i].tsId) {
			if (talkingMembers.indexOf(membersData[i].tsId) !== -1) {
				membersData[i].isTalking = true;
				showMemberTalking(membersData[i].id);
			} else {
				membersData[i].isTalking = false;
				hideMemberTalking(membersData[i].id);
			}
		}
	}
}

function showMemberTalking(id) {
	var $memberCard = $('#member-'+id);
	var $listItem = $memberCard.parent('li');

	$listItem.css({opacity: 1.0, height: $memberCard.outerHeight(), marginTop: 12});
}

function hideMemberTalking(id) {
	var $memberCard = $('#member-'+id);
	var $listItem = $memberCard.parent('li');

	$listItem.css({opacity: 0.0, height: 0, marginTop: 0});
}

//functions - setup utilities

function clearTeamspeakConnectionData() {
	var i, len;

	//init TS connection status as 'disconnected'
	window.localStorage.setItem('rn.ts.connectionStatus', "disconnected");
	//remove member TS ids (could have been left by shutdown while connected to TS)
	for (i = 0, len = membersData.length; i < len; i += 1) {
		delete membersData[i].tsId;
	}
	window.localStorage.setItem('rn.members', JSON.stringify(membersData));
}

function setFirstTimeDefaults() {
	if (!window.localStorage.hasOwnProperty('rn.members')) {
		window.localStorage.setItem('rn.members', JSON.stringify([]));
	}
	//settings
	if (!window.localStorage.hasOwnProperty('rn.settings.tsAutoConnect')) {
		window.localStorage.setItem('rn.settings.tsAutoConnect', false);
	}
	if (!window.localStorage.hasOwnProperty('rn.settings.tsAutoSync')) {
		window.localStorage.setItem('rn.settings.tsAutoSync', true);
	}
	if (!window.localStorage.hasOwnProperty('rn.settings.useClipboardPlugin')) {
		window.localStorage.setItem('rn.settings.useClipboardPlugin', true);
	}
}

//init

$(document).ready(function init() {
	//globals init
	$body = $('body');

	//button actions
	$('#btnGroup').on('click', {name: 'group'}, handleWindowButton);
	$('#btnLead').on('click', {name: 'lead'}, handleWindowButton);
	$('#btnSettings').on('click', {name: 'settings'}, handleWindowButton);
	//TODO: TOOLS
	$('#btnClose').on('click', closeWindow);
	
	//storage
	setFirstTimeDefaults();
	window.addEventListener('storage', handleStorage, false);
		var val;
		//get initial member information
		val = window.localStorage.getItem('rn.members');
		if (val) {
			updateMembers(val);
		}
		//clear TS connection data
		clearTeamspeakConnectionData();
		//TODO: clear teamspeak ids for all members
			// if (connectionData.status === "disconnected") {
			// 	clearMembersTeamspeakIds();
			// }
			// function clearMembersTeamspeakIds() {
			// 	var i, len;
			// 	for (i = 0, len = membersData.length; i < len; i += 1) {
			// 		delete membersData[i].tsId;
			// 	}
			// }

	//persistent window
	openWindow("persistent");

	//template binding
	document.querySelector('#memberListTemplate').members = membersData;
});
