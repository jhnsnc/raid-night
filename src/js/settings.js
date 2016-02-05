//global variables

//functions - settings manipulation
function setCurrentValues() {
	var setting, selected;

	//Overlay Alignment
	// setting = window.localStorage.getItem("rn.settings.overlayalign");
	// if (setting) {
	// 	selected = $('#selectOverlayAlignment paper-radio-button[name="'+window.localStorage.getItem("rn.settings.overlayalign")+'"]').get(0);
	// 	$('#selectOverlayAlignment').get(0).selected = selected;
	// 	selected.checked = true;
	// }

	//TeamSpeak Settings
	$('#toggleTsAutoConnect').get(0).checked = JSON.parse(window.localStorage.getItem('rn.settings.tsAutoConnect'));
	$('#toggleTsAutoSync').get(0).checked = JSON.parse(window.localStorage.getItem('rn.settings.tsAutoSync'));
	//Raid Script Settings
	$('#toggleUseClipboard').get(0).checked = JSON.parse(window.localStorage.getItem('rn.settings.useClipboardPlugin'));
}

// function onOverlayAlignmentSelect(evt) {
// 	if (evt.detail.isSelected) {
// 		window.localStorage.setItem("rn.settings.overlayalign", $(evt.detail.item).attr('name'));
// 	}
// }

function resetMembersData() {
	window.localStorage.setItem('rn.members', JSON.stringify([]));
}

function resetAllData() {
	window.localStorage.clear();
}

//functions - event handlers

function handleToggleClick(evt) {
	window.localStorage.setItem(evt.data.setting, evt.target.checked);
}

function handleResetMembersClick(evt) {
	showConfirmDialog({
		callback: resetMembersData, 
		target: undefined, 
		title:'Confirm Members Reset', 
		message: 'Are you sure you want to remove all members? This action cannot be reversed.', 
		confirmText: 'Reset'
	});
}

function handleResetAllClick(evt) {
	showConfirmDialog({
		callback: resetAllData, 
		target: undefined, 
		title:'Confirm Full Reset', 
		message: 'Are you sure you want to reset ALL app data? <br/>This will delete all saved members, scripts, and settings. This action cannot be reversed.', 
		confirmText: 'Full Reset'
	});
}

//functions - dialog

function showConfirmDialog(options) {
	if (typeof options !== 'undefined' && typeof options.callback !== 'undefined') {
		var $dialog = $('.dialog.confirmDialog');
		var $blackout = $('.confirmBlackout');
		
		//set initial
		if (typeof options.title !== 'undefined') {
			$dialog.find('.title').html(options.title);
		} else {
			$dialog.find('.title').html('Confirm Reset');
		}
		if (typeof options.message !== 'undefined') {
			$dialog.find('.message').html(options.message);
		} else {
			$dialog.find('.message').html('Are you sure? This action cannot be reversed.');
		}
		if (typeof options.confirmText !== 'undefined') {
			$dialog.find('.btnConfirm').attr('label', options.confirmText);
		} else {
			$dialog.find('.btnConfirm').attr('label', 'Confirm');
		}
		if (typeof options.cancelText !== 'undefined') {
			$dialog.find('.btnCancel').attr('label', options.cancelText);
		} else {
			$dialog.find('.btnCancel').attr('label', 'Cancel');
		}
		$blackout.addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$dialog.addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$blackout.get(0).offsetHeight; //trigger CSS reflow
		$dialog.get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$blackout.removeClass('noTransition').css({opacity: 1.0});
		$dialog.removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$dialog.data('callback', options.callback);
		if (typeof options.target !== 'undefined') {
			$dialog.data('target', options.target);
		}
	}
}

function handleConfirmDialogCancel() {
	hideConfirmDialog();
}

function handleConfirmDialogConfirm() {
	var $dialog = $('.dialog.confirmDialog');
	//take action
	var callback = $dialog.data('callback');
	var target = $dialog.data('target');
	callback(target);
	//clear
	$dialog.data('callback', undefined);
	$dialog.data('target', undefined);
	//hide
	hideConfirmDialog();
}

function hideConfirmDialog() {
	var $dialog = $('.dialog.confirmDialog');
	var $blackout = $('.confirmBlackout');
	//reset data
	$dialog.data('index', -1);
	//fade out
	$blackout.css({opacity: 0.0});
	$dialog.css({opacity: 0.0, marginTop: 20});
	//deactivate
	setTimeout(function() {
		if ($dialog.data('index') === -1) {
			$blackout.removeClass('active');
			$dialog.removeClass('active');
		}
	}, 400);
}

//init
$(document).ready(function init() {
	var interval = setInterval(function() {
		if (typeof $('body').attr('unresolved') === 'undefined') {
			clearInterval(interval);
			//init all inputs to reflect current settings
			setCurrentValues();

			//button actions
			$('#btnClose').on('click', closeWindow);
			//confirm dialog
			$('.confirmDialog .btnCancel').on('click', handleConfirmDialogCancel);
			$('.confirmDialog .btnConfirm').on('click', handleConfirmDialogConfirm);
				//TeamSpeak Settings
			$('#toggleTsAutoConnect').on('change', {setting: 'rn.settings.tsAutoConnect'}, handleToggleClick);
			$('#toggleTsAutoSync').on('change', {setting: 'rn.settings.tsAutoSync'}, handleToggleClick);
				//Raid Script Settings
			$('#toggleUseClipboard').on('change', {setting: 'rn.settings.useClipboardPlugin'}, handleToggleClick);
				//Reset
			$('#btnResetMembersData').on('click', handleResetMembersClick);
			$('#btnResetAll').on('click', handleResetAllClick);

			//input events
			// $('#selectOverlayAlignment').get(0).addEventListener('core-select', onOverlayAlignmentSelect, false);
		}
	}, 50);
});
