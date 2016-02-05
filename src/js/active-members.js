//variables
var defaultColor = 'blueGrey';
var defaultIcon = 'default';

var membersData = []; 	//mirrors group.js: { 
						//		id: Number, name: String, colorClass: String, 
						//		role: String, icon: String, 
						//		tsId: int, tsName: String 
						//	}

//functions - storage

function storeMembersData() {
	console.log("Storing members data");
	window.localStorage.setItem('rn.members', JSON.stringify(membersData));
}

function handleActiveMembersStorage(evt) {
	switch (evt.key) {
		case 'rn.members':
			updateMembers(evt.newValue);
			break;
		case 'rn.ts.channelMembers':
			//handleChannelMembers(evt.newValue);
			//called directly by teamspeak.js
			//TODO: handle this without dependency on teamspeak.js
			break;
		default:
			break;
	}
}

//functions - event handlers

function updateMembers(jsonString) {
	console.log("Updating members data");

	var obj = JSON.parse(jsonString);
	Array.prototype.splice.apply(membersData, [0, membersData.length].concat(obj));
}

function handleChannelMembers(jsonString) {
	if (JSON.parse(window.localStorage.getItem('rn.settings.tsAutoSync'))) {
		console.log("Channel members changed. Updating member active statuses.");

		var i, j, isInChannel, channelMemberId, newMember;

		var unmatchedChannelMembers = JSON.parse(jsonString);

		//mark existing members as active/inactive
		for (i = 0; i < membersData.length; i += 1) {
			if (membersData[i].tsName) { //we only care about TS members
				//find match in channel
				isInChannel = false;
				for (j = 0; j < unmatchedChannelMembers.length; j += 1) {
					if (unmatchedChannelMembers[j].name === membersData[i].tsName) {
						isInChannel = true;
						channelMemberId = unmatchedChannelMembers[j].id;
						unmatchedChannelMembers.splice(j,1); //remove from list of unmatched channel members
						break;
					}
				}
				if (isInChannel) {
					console.log("Connecting existing member \'" + membersData[i].name + "\' " + 
						"with: {id: " + channelMemberId + "}");
					membersData[i].isActive = true;
					membersData[i].tsId = channelMemberId;
				} else {
					membersData[i].isActive = false;
					membersData[i].tsId = null;
				}
			}
		}
		//go through remaining channel members and create new members
		for (i = 0; i < unmatchedChannelMembers.length; i += 1) {
			console.log("Unmatched member: {id: "+unmatchedChannelMembers[i].id+", name: "+unmatchedChannelMembers[i].name+"}")
			addNewMember(unmatchedChannelMembers[i].id, unmatchedChannelMembers[i].name);
		}

		storeMembersData();
	}
}

//functions - member management

function addNewMember(tsId, tsName) { //like in group.js, but with fewer options supported
	console.log("Adding a new member");

	if (typeof tsId === 'undefined' || typeof tsName === 'undefined') {
		return undefined;
	}

	//adds a new member to the membersData array; returns the id of the new member
	var newMember = {};

	//id
	var r = Math.floor(Math.random() * 999) + 1;
	while (getMemberById(r) !== -1) {
		r = Math.floor(Math.random() * 999) + 1;
	}
	newMember.id = r;
	//name
	newMember.name = tsName;
	//color class
	newMember.colorClass = defaultColor;
	//role
	newMember.role = null;
	//icon
	newMember.icon = defaultIcon;
	//teamspeak id
	newMember.tsId = tsId;
	//teamspeak name
	newMember.tsName = tsName;
	//is talking flag
	newMember.isTalking = false;
	//is active flag
	newMember.isActive = true;

	membersData.push(newMember);
	console.log("New member created successfully; id = "+newMember.id);
	return newMember.id;
}

//functions - misc

function getMemberByTsName(searchName) {
	//returns the index of the member that matches the name provided; returns -1 if no match
	var i, len;
	for (i = 0, len = membersData.length; i < len; i += 1) {
		if (membersData[i].tsName === searchName) {
			return i;
		}
	}
	return -1;
}

function getMemberById(searchId) {
	//returns the index of the member that matches the id provided; returns -1 if no match
	//	searchId can be a number (e.g. 1234) or an id string (e.g. 'member-1234')
	var i, len;
	for (i = 0, len = membersData.length; i < len; i += 1) {
		if (membersData[i].id === searchId) {
			return i;
		}
		if ('member-'+membersData[i].id === searchId) {
			return i;
		}
	}
	return -1;
}

//init
(function init() {
	console.log("ACTIVE-MEMBERS.JS INIT");

	//events
	window.addEventListener('storage', handleActiveMembersStorage, false);

	//storage
		var val;
		//get initial members data
		val = window.localStorage.getItem('rn.members');
		if (val) {
			membersData = JSON.parse(val);
		}
}());
