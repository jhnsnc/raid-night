//global variables
var colorClasses = [
		'red', 'pink', 'purple', 'blue', 'cyan', 'green', 
		'lightGreen', 'yellow', 'orange', 'deepOrange', 'brown', 'blueGrey'
	];

var iconOptions = [
		'default', 'flag', 'star', 'heart', 'cloud',
		'shield', 'blade', 'bow', 'daggers', 'fangs', 
		'wand', 'bomb', 'lightning', 'sun', 'leaf', 
		'earth', 'fire', 'ice'
	];

var membersData = []; 	//each: { 
						//		id: Number, name: String, colorClass: String, 
						//		role: String, icon: String, 
						//		tsId: int, tsName: String 
						//	}
var connectionData = {};

//functions - storage

function storeMembersData() {
	console.log("Storing members data");
	window.localStorage.setItem('rn.members', JSON.stringify(membersData));
}
function getChannelMembersFromStorage() {
	return JSON.parse( window.localStorage.getItem('rn.ts.channelMembers') );
}

function handleStorage(evt) {
	switch (evt.key) {
		case 'rn.members':
			handleMembers(evt.newValue);
			break;
		case 'rn.ts.connectionStatus':
			handleConnectionStatus(evt.newValue);
			break;
		case 'rn.ts.channelMembers':
			handleChannelMembers(evt.newValue);
		default:
			break;
	}
}

function handleMembers(jsonString) {
	console.log("Updating members data");

	var obj = JSON.parse(jsonString);
	Array.prototype.splice.apply(membersData, [0, membersData.length].concat(obj));
}

function handleConnectionStatus(status) {
	var callback;

	connectionData.status = status;
	
	if (status === "connected") {
		//automatically sync members with TS members
		teamspeakSync();
		//clear callback queue
		callback = connectionData.queuePendingConnection.shift();
		while (callback) {
			callback();
			callback = connectionData.queuePendingConnection.shift();
		}
	}
}

function handleChannelMembers() {
	teamspeakSync(); //will automatically push an update to members
}

//functions - event handlers

function handleAddMemberButton(evt) {
	var newId = addMember();

	openEditMemberDialog( getMemberById(newId) );
}

function handleEditMember(evt) {
	var idx;

	idx = getMemberById($(evt.target).parents('li').find('.memberCard').attr('id'));
	if (idx === -1) {
		console.log('Member not found. Click event target:');
		console.log(evt.target);
		return;
	}

	openEditMemberDialog(idx);
}

function handleEditMemberDialogSubmit(evt) {
	var idx;
	var val;

	idx = getMemberById($('.dialog.editMemberDialog').data('id'));
	if (idx === -1) {
		console.log('Member not found. Click event target:');
		console.log(evt.target);
		return;
	}

	//save values from dialog inputs
	applyEditMemberDialog(idx);
}

function handleRemoveMember(evt) {
	var idx = getMemberById($(evt.target).parents('li').find('.memberCard').attr('id'));
	if (idx !== -1) {
		removeMember(idx);
	}
}

function handleRearrangeMember(evt) {
	//make sure there isn't already a rearrange move happening
	if ($('li.dragPlaceholder').length < 1) {
		var $targetListItem = $(evt.target).parents('li');
		var $placeholder;
		//insert placeholder before to reserve spot
		$placeholder = $('<li class="dragPlaceholder active"></li>');
		$placeholder.css('height', $targetListItem.outerHeight());
		$targetListItem.before($placeholder);
		//'lift up' (w/ CSS) and 'grab' (w/ JS) the element
		$targetListItem.addClass('noTransition');
		$targetListItem.css('top', $placeholder.position().top).addClass('dragActive');
		$targetListItem.get(0).offsetHeight; //trigger CSS reflow
		$targetListItem.removeClass('noTransition');
		$targetListItem.addClass('dragSelected');
		//set up handler for mouse release
		$('html').addClass('rearranging');
		$('html').on('mouseup', handleRearrangeMemberEnd);
		//set up update function to show rearrange preview
		$('html').on('mousemove', handleRearrangeMemberTick);
	}
}

function handleRearrangeMemberTick(evt) {
	var $targetListItem = $('li.dragActive');
	var $memberList = $targetListItem.parents('ul.memberList');
	var $placeholder = $('li.dragPlaceholder');
	var dragY = evt.pageY - $memberList.offset().top;
	var placholderY, $placeholderSwap;

	//update dragged item position
	if (dragY < 0) {
		dragY = 0;
	} else if (dragY > $targetListItem.parents('ul.memberList').outerHeight()) {
		dragY = $targetListItem.parents('ul.memberList').outerHeight();
	}
	$targetListItem.css('top', dragY - ($targetListItem.outerHeight() / 2));
	//relocate dragPlaceholder if dragged into new spot
	placholderY = $placeholder.position().top
	if (dragY < placholderY) {
		//dragged above current position
		$placeholderSwap = $placeholder.prev('li');
		if ($placeholderSwap.length) { //make sure it's not already the first
			while(!$placeholderSwap.hasClass('active')) { //keep looking back until you find an active one
				if ($placeholderSwap.prev('li').length) {
					$placeholderSwap = $placeholderSwap.prev('li');
				} else {
					break;
				}
			}
			$placeholderSwap.before($placeholder.detach());
		}
	} else if (dragY > placholderY + $placeholder.outerHeight()) {
		//dragged below current position
		$placeholderSwap = $placeholder.next('li');
		if ($placeholderSwap.length) { //make sure it's not already the last
			while(!$placeholderSwap.hasClass('active')) { //keep looking forwards until you find an active one
				if ($placeholderSwap.next('li').length) {
					$placeholderSwap = $placeholderSwap.next('li');
				} else {
					break;
				}
			}
			$placeholderSwap.after($placeholder.detach());
		}
	}
}

function handleRearrangeMemberEnd(evt) {
	var $targetListItem = $('li.dragActive.dragSelected');
	var $placeholder = $('li.dragPlaceholder');
	var targetIdx;

	//clear handlers
	$('html').removeClass('rearranging');
	$('html').off('mousemove', handleRearrangeMemberTick);
	$('html').off('mouseup', handleRearrangeMemberEnd);
	//get destination index
	targetIdx = $('ul.memberList li').index($placeholder);
	if ($('ul.memberList li').index($placeholder) > $('ul.memberList li').index($targetListItem)) {
		targetIdx -= 1;
	}
	//remove placeholder
	$placeholder.detach();
	//return rearranged element to normal
	$targetListItem.css('top', 0).removeClass('dragActive').removeClass('dragSelected');
	//rearrange target list item to match drag end position
	rearrangeMember($('ul.memberList li').index($targetListItem), targetIdx);
}

function handlePickerBlackoutClick(evt) {
	$(evt.target).siblings('.iconPicker').css('display', 'none');
	$(evt.target).siblings('.colorPicker').css('display', 'none');
	$(evt.target).removeClass('active');
}

function handleIconPickerButton(evt) {
	var $iconPicker = $(evt.target).siblings('.iconPicker');
	var $pickerBlackout = $(evt.target).siblings('.pickerBlackout');

	if ( $iconPicker.css('display') !== 'block' ) {
		$iconPicker.siblings('.picker').css('display', 'none');
		$iconPicker.css('display', 'block');
		$pickerBlackout.addClass('active');
	} else {
		$iconPicker.css('display', 'none');
		$pickerBlackout.removeClass('active');
	}
}

function handleIconOptionSelect(evt) {
	var $iconPicker = $(evt.target).parent();
	var $button = $iconPicker.siblings('.btnPickIcon');
	var $pickerBlackout = $iconPicker.siblings('.pickerBlackout');

	//remove old value
	$button.removeClass( $iconPicker.data('icon') );
	//set new value
	$iconPicker.data('icon', $(evt.target).data('icon'));
	$button.addClass( $iconPicker.data('icon') );
	$button.get(0).icon = 'player-icon-' + $iconPicker.data('icon');
	//hide icon picker
	$iconPicker.css('display', 'none');
	$pickerBlackout.removeClass('active');
}

function handleColorPickerButton(evt) {
	var $colorPicker = $(evt.target).siblings('.colorPicker');
	var $pickerBlackout = $(evt.target).siblings('.pickerBlackout');

	if ( $colorPicker.css('display') !== 'block' ) {
		$colorPicker.siblings('.picker').css('display', 'none');
		$colorPicker.css('display', 'block');
		$pickerBlackout.addClass('active');
	} else {
		$colorPicker.css('display', 'none');
		$pickerBlackout.removeClass('active');
	}
}

function handleColorOptionSelect(evt) {
	var $colorPicker = $(evt.target).parent();
	var $button = $colorPicker.siblings('.btnPickColor');
	var $pickerBlackout = $colorPicker.siblings('.pickerBlackout');

	//remove old value
	$button.removeClass( $colorPicker.data('color') );
	//set new value
	$colorPicker.data('color', $(evt.target).data('color'));
	$button.addClass( $colorPicker.data('color') );
	//hide color picker
	$colorPicker.css('display', 'none');
	$pickerBlackout.removeClass('active');
}

//functions - manage member list

function addMember(options) {
	console.log("Adding a new member");
	//adds a new member to the membersData array; returns the id of the new member
	var newMember = {};

	if (typeof options === 'undefined') {
		options = {};
	}
	//id
	var r = Math.floor(Math.random() * 999) + 1;
	while (getMemberById(r) !== -1) {
		r = Math.floor(Math.random() * 999) + 1;
	}
	newMember.id = r;
	//name
	if (options.name) {
		newMember.name = '' + options.name;
	} else {
		newMember.name = '';
	}
	//color class
	if (options.colorClass && colorClasses.indexOf(options.colorClass) !== -1) {
		newMember.colorClass = options.colorClass;
	} else {
		newMember.colorClass = colorClasses[colorClasses.length-1];
	}
	//role
	if (options.role) {
		newMember.role = options.role;
	} else {
		newMember.role = null;
	}
	//icon
	if (options.icon && iconOptions.indexOf(options.icon) !== -1) {
		newMember.icon = options.icon;
	} else {
		newMember.icon = iconOptions[0];
	}
	//teamspeak id
	if (options.tsId) {
		newMember.tsId = options.tsId;
	} else {
		newMember.tsId = null;
	}
	//teamspeak name
	if (options.tsName) {
		newMember.tsName = options.tsName;
	} else {
		newMember.tsName = null;
	}
	//is talking flag
	newMember.isTalking = false;
	//is active flag
	newMember.isActive = true;

	membersData.push(newMember);
	return newMember.id;
}

function applyEditMemberDialog(idx) {
	console.log("Applying changes from \'edit member\' dialog");
	var $dialog = $('.dialog.editMemberDialog');
	var val;

	//name
	val = $dialog.find('.txtName').val();
	if (typeof val !== 'undefined' && val != '') {
		membersData[idx].name = String.prototype.trim.apply(val);
	}
	$dialog.find('.tsName').removeClass('active');
	$dialog.find('.tsName span').html('');
	//role
	val = $dialog.find('.txtRole').val();
	if (typeof val !== 'undefined') {
		membersData[idx].role = String.prototype.trim.apply(val);
	}
	//icon
	val = $dialog.find('.iconPicker').data('icon');
	if (val != '' && iconOptions.indexOf(val) !== -1) {
		membersData[idx].icon = val;
	}
	//color
	val = $dialog.find('.colorPicker').data('color');
	if (val != '' && colorClasses.indexOf(val) !== -1) {
		membersData[idx].colorClass = val;
	}
	//save
	storeMembersData();

	//fade out
	$('.blackout').css({opacity: 0.0});
	$dialog.css({opacity: 0.0, marginTop: 20});
	//deactivate
	$dialog.data('id', '')
	setTimeout(function() {
		if ($dialog.data('id') === '') {
			$('.blackout').removeClass('active');
			$dialog.removeClass('active');
		}
	}, 400);
}

function removeMember(idx) {
	console.log("Deleting a member");
	if (membersData[idx].tsName) {
		//member has a TS identity, deactivate
		membersData[idx].isActive = false;
	} else {
		//member is not in TS, fully remove
		membersData[idx] = {};
		membersData.splice(idx, 1);
	}
	
	storeMembersData();
}

function rearrangeMember(startIdx, endIdx) {
	console.log("Rearranging member");
	//membersData.splice(endIdx, 0, membersData.splice(startIdx, 1));
	Array.prototype.splice.apply(membersData, [endIdx, 0].concat(membersData.splice(startIdx, 1)));

	storeMembersData();
}

function getMemberByName(searchName) {
	//returns the index of the member that matches the name provided; returns -1 if no match
	var i, len;
	for (i = 0, len = membersData.length; i < len; i += 1) {
		if (membersData[i].name === searchName) {
			return i;
		}
	}
	return -1;
}

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

//functions - teamspeak

function teamspeakConnect() {
	console.log("Attempting to connect to TeamSpeak");
	window.localStorage.setItem('rn.ts.connectionStatus', "refreshing");
}

function teamspeakSync() {
	if (connectionData.status !== "connected") {
		//no need to queue sync since sync automatically happens upon connect
		teamspeakConnect();
	} else {
		console.log("Syncing member data with TeamSpeak");
		var tsMembers = getChannelMembersFromStorage();
		var i, len;
		var arr;

		for (i = 0, len = membersData.length; i < len; i += 1) {
			if (membersData[i].tsName) { //has tsName
				arr = tsMembers.filter(function(obj) {
					return obj.name === membersData[i].tsName;
				});
				if (arr.length > 0) {
					//a tsMember matches tsName -- activate
					membersData[i].tsName = arr[0].name;
					membersData[i].tsId = arr[0].id;
					membersData[i].isActive = true;
				} else {
					//member not in channel -- deactivate
					delete membersData[i].tsId;
					membersData[i].isActive = false;
				}
			} else { //no tsName
				if (getMemberByTsName(membersData[i].name) === -1) {
					//this member's name has not been claimed as a tsName -- check if match exists
					arr = tsMembers.filter(function(obj) {
						return obj.name === membersData[i].name;
					});
					if (arr.length > 0) {
						//a tsMember matches display name -- activate and assign tsName
						membersData[i].tsName = arr[0].name;
						membersData[i].tsId = arr[0].id;
						membersData[i].isActive = true;
					} else {
						//no match in channel and no tsName -- deactivate
						delete membersData[i].tsId;
					}
				} else {
					//member's name is claimed as tsName -- deactivate
					delete membersData[i].tsId;
				}
			}
		}
		//update members
		storeMembersData();
	}
}

function teamspeakPopulate() {
	if (connectionData.status !== "connected") {
		connectionData.queuePendingConnection.push(teamspeakPopulate);
		teamspeakConnect();
	} else {
		console.log("Populating member data from TeamSpeak");
		var tsMembers = getChannelMembersFromStorage();
		var i, len;
		var idx;

		for (i = 0, len = tsMembers.length; i < len; i += 1) {
			idx = getMemberByTsName(tsMembers[i].name);
			if (idx !== -1) {
				//a member has a matching tsName
				membersData[idx].tsName = tsMembers[i].name;
				membersData[idx].tsId = tsMembers[i].id;
				membersData[idx].isActive = true;
			} else {
				idx = getMemberByName(tsMembers[i].name);
				if (idx !== -1) {
					//a member has a matching display name
					membersData[idx].tsName = tsMembers[i].name;
					membersData[idx].tsId = tsMembers[i].id;
					membersData[idx].isActive = true;
				} else {
					//no match found; add new member
					addMember({name: tsMembers[i].name, tsName: tsMembers[i].name, tsId: tsMembers[i].id});
				}
			}
		}
		//update members
		storeMembersData();
	}
}

//functions - misc

function openEditMemberDialog(idx) {
	var $blackout = $('.blackout');
	var $dialog = $('.dialog.editMemberDialog');
	var $colorPicker, $iconPicker, $button;

	//set initial
	$blackout.addClass('noTransition').css({opacity: 0.0}).addClass('active');
	$dialog.addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
	$blackout.get(0).offsetHeight; //trigger CSS reflow
	$dialog.get(0).offsetHeight; //trigger CSS reflow
	//fade in
	$blackout.removeClass('noTransition').css({opacity: 1.0});
	$dialog.removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
	//init values
	$dialog.data('id', membersData[idx].id);
		//name
	$dialog.find('.txtName').val(membersData[idx].name).focus();
	if (membersData[idx].tsName) { //has tsName
		$dialog.find('.tsName').addClass('active');
		$dialog.find('.tsName span').html(membersData[idx].tsName);
	} else { //no tsName
		$dialog.find('.tsName').removeClass('active');
		$dialog.find('.tsName span').html('');
	}
		//role
	$dialog.find('.txtRole').val(membersData[idx].role);
		//icon
	$iconPicker = $dialog.find('.iconPicker');
	$button = $dialog.find('.btnPickIcon');
	$iconPicker.css('display', 'none');
	$button.removeClass( $iconPicker.data('icon') );
	$iconPicker.data('icon', membersData[idx].icon);
	$button.addClass( $iconPicker.data('icon') );
	$button.get(0).icon = 'player-icon-' + $iconPicker.data('icon');
		//color
	$colorPicker = $dialog.find('.colorPicker');
	$button = $dialog.find('.btnPickColor');
	$colorPicker.css('display', 'none');
	$button.removeClass( $colorPicker.data('color') );
	$colorPicker.data('color', membersData[idx].colorClass);
	$button.addClass( $colorPicker.data('color') );
}

//init

$(document).ready(function init() {
	//button actions
	$('.btnAddMember').on('click', handleAddMemberButton);
	//$('.btnTeamspeakSync').on('click', teamspeakSync); //handled through @onlick in markup due to templating issues
	//$('.btnTeamspeakMerge').on('click', teamspeakMerge); //handled through @onlick in markup due to templating issues
	$('#btnClose').on('click', closeWindow);

	//$('.btnRefreshConnection').on('click', teamspeakConnect); //handled through @onlick in markup due to templating issues

	$('body').on('click', '.btnEditMember', handleEditMember);
	$('body').on('click', '.btnRemoveMember', handleRemoveMember);
	$('body').on('mousedown', '.btnRearrangeMember', handleRearrangeMember);
	
	$('.dialog.editMemberDialog .btnDone').on('click', handleEditMemberDialogSubmit);

	//set up icon/color pickers
	$('.pickerBlackout').on('click', handlePickerBlackoutClick);
	$('.btnPickIcon').on('click', handleIconPickerButton);
	$('.iconPicker .iconOption').on('click', handleIconOptionSelect);
	$('.btnPickColor').on('click', handleColorPickerButton);
	$('.colorPicker .colorOption').on('click', handleColorOptionSelect);

	//storage
	window.addEventListener('storage', handleStorage, false);
		var val;
		//get initial connection status
		val = window.localStorage.getItem('rn.ts.connectionStatus');
		if (val) {
			connectionData = {
				status: val, 
				queuePendingConnection: []
			};
		} else {
			connectionData = {
				status: "disconnected", 
				queuePendingConnection: []
			};
		}
		//get initial members content
		val = window.localStorage.getItem('rn.members');
		if (val) {
			membersData = JSON.parse(val);
		}


	//template binding
	document.querySelector('#memberListTemplate').members = membersData;
	document.querySelector('#tsConnectionStatusTemplate').data = connectionData;
});
