//global variables
var stepsData = []; 	//each: {
						//		title:String,
						//		contentChunks:Object[] {
						//			type: String ("text", "link", "list"), "split"
						//			content: String or Object
						//		}
						//	}
var currentStep = 0;
var savedScripts = [];	//String[] - each is name of saved script

//functions - storage
function handleStorage(evt) {
	switch (evt.key) {
		default:
			break;
	}
}

function getStepsData() {
	var val = window.localStorage.getItem('rn.script.stepsData');
	if (!val) {
		return [];
	} else {
		return JSON.parse( val );
	}
}

function storeStepsData() {
	window.localStorage.setItem('rn.script.stepsData', JSON.stringify(stepsData));
}

function getCurrentStep() {
	var val = parseInt( window.localStorage.getItem('rn.script.currentStep'), 10 );
	if (isNaN(val)) {
		return 0;
	} else {
		return val;
	}
}

function storeCurrentStep() {
	window.localStorage.setItem('rn.script.currentStep', currentStep);
}

function getScriptsList() {
	var val = window.localStorage.getItem('rn.script.savedScriptsList');
	if (!val) {
		return [];
	} else {
		return JSON.parse( val );
	}
}

function storeScriptsList() {
	window.localStorage.setItem('rn.script.savedScriptsList', JSON.stringify(savedScripts));
}

function getScript(name) {
	var val = window.localStorage.getItem('rn.script.saved.' + name);
	if (!val) {
		return [generateCleanStepData()];
	} else {
		return JSON.parse( val );
	}
}

function storeScript(name) {
	window.localStorage.setItem('rn.script.saved.' + name, JSON.stringify(stepsData));
}

function removeScriptFromStorage(name) {
	window.localStorage.removeItem('rn.script.saved.' + name);
}

function generateDefaultStepsData() {
	return [
		{
			title: 'Sample Script',
			contentChunks: [
				{
					type: 'text',
					content: 'This is sample content.'
				}, {
					type: 'text',
					content: 'Click the right arrow in the bar above to learn more.'
				}, {
					type: 'link',
					content: {
						label: 'Overwolf',
						location: 'http://www.overwolf.com/'
					}
				}, {
					type: 'link',
					content: {
						label: 'TeamSpeak',
						location: 'http://www.teamspeak.com/'
					}
				}
			]
		}, {
			title: 'About Scripts',
			contentChunks: [
				{
					type: 'text',
					content: 'Here in the raid script panel you can organize information about your raid so you can focus on leading your group effectively.'
				}, {
					type: 'text',
					content: 'The buttons on the left allow you to easily post content to your TeamSpeak server or copy it for pasting in game chat.'
				}
			]
		}, {
			title: 'How to Edit Scripts',
			contentChunks: [
				{
					type: 'list',
					ordered: true,
					content: [
						'Click the edit icon in the toolbar at the top',
						'Choose \"Edit Current Step\"',
						'Change the step title', 
						'Add, delete, rearrange, and edit content chunks',
						'Click the \"Done\" button at the bottom to finish editing (or choose \"Edit Current Step\" again)'
					]
				}, {
					type: 'text',
					content: 'Other things you can do:'
				}, {
					type: 'list',
					ordered: false,
					content: [
						'Add new steps (before or after)', 
						'Delete steps', 
						'Clear all script data', 
						'Import script data from a file on your computer', 
						'Save your script to a file on your computer'
					]
				}
			]
		}
	];
}

function generateCleanStepData() {
	return {title: '', contentChunks: []};
}

function updateStepTitleInfo() {
	var template = document.querySelector('#stepTitleInfoTemplate');
	if (stepsData[currentStep].title.length > 0) {
		template.title = stepsData[currentStep].title;
	} else {
		template.title = "Step " + (currentStep + 1);
	}
	template.currentStep = currentStep + 1;
	template.numSteps = stepsData.length;
}

function updateChunksContent() {
	document.querySelector('#chunkEmptyNoticeTemplate').contentChunks = stepsData[currentStep].contentChunks;
	document.querySelector('#chunkContentTemplate').contentChunks = stepsData[currentStep].contentChunks;
}

function pushTeamspeakMessage(msgContent) {
	var messages = JSON.parse(window.localStorage.getItem('rn.ts.pendingMessages'));
	if (!messages || !messages.length) {
		messages = [];
	}
	messages.push(msgContent);
	window.localStorage.setItem('rn.ts.pendingMessages', JSON.stringify(messages));
}

//functions - event handlers

function enableStepControlButtons() {
	$('.btnPrevStep').removeClass('disabled').on('click', handlePreviousStep);
	$('.btnNextStep').removeClass('disabled').on('click', handleNextStep);	
}

function disableStepControlButtons() {
	$('.btnPrevStep').addClass('disabled').off('click', handlePreviousStep);
	$('.btnNextStep').addClass('disabled').off('click', handleNextStep);	
}

function handlePreviousStep(evt) {
	if (stepsData.length > 1) {
		console.log("Changing to previous step");

		//animate out
		$('.stepStatusBar h2').addClass('offscreenRight').addClass('faded');
		$('ul.stepChunksList').addClass('offscreenRight').addClass('faded');
		setTimeout(function() {
			//change values
			currentStep -= 1;
			if (currentStep < 0) {
				currentStep += stepsData.length;
			}
			updateStepTitleInfo();
			updateChunksContent();
			storeCurrentStep();
			//animate in
			$('.stepStatusBar h2').addClass('noTransition').removeClass('offscreenRight');
			$('ul.stepChunksList').addClass('noTransition').removeClass('offscreenRight');
			$('.stepStatusBar h2').get(0).offsetHeight; //trigger CSS reflow
			$('ul.stepChunksList').get(0).offsetHeight; //trigger CSS reflow
			$('.stepStatusBar h2').removeClass('noTransition').removeClass('faded');
			$('ul.stepChunksList').removeClass('noTransition').removeClass('faded');
		}, 250);
	}
}

function handleNextStep(evt) {
	if (stepsData.length > 1) {
		console.log("Changing to next step");

		//animate out
		$('.stepStatusBar h2').addClass('offscreenLeft').addClass('faded');
		$('ul.stepChunksList').addClass('offscreenLeft').addClass('faded');
		setTimeout(function() {
			//change values
			currentStep += 1;
			if (currentStep >= stepsData.length) {
				currentStep -= stepsData.length;
			}
			updateStepTitleInfo();
			updateChunksContent();
			storeCurrentStep();
			//animate in
			$('.stepStatusBar h2').addClass('noTransition').removeClass('offscreenLeft');
			$('ul.stepChunksList').addClass('noTransition').removeClass('offscreenLeft');
			$('.stepStatusBar h2').get(0).offsetHeight; //trigger CSS reflow
			$('ul.stepChunksList').get(0).offsetHeight; //trigger CSS reflow
			$('.stepStatusBar h2').removeClass('noTransition').removeClass('faded');
			$('ul.stepChunksList').removeClass('noTransition').removeClass('faded');
		}, 250);
	}
}

//functions - script editing

function editCurrentStep() {
	if (!$('.windowWrapper').hasClass('editing')) {
		console.log("Editing current step");

		//init inputs to current values
			//step title
		$('.stepMetaInfoInputs').find('.txtStepTitle').val(stepsData[currentStep].title);

		disableStepControlButtons();
		$('.windowWrapper').addClass('editing');
	} else {
		saveStepEdits();
	}
}

function saveStepEdits() {
	if ($('.windowWrapper').hasClass('editing')) {
		console.log("Saving edits to current step");
		var val;

		//save values
			//step title
		val = $('.stepMetaInfoInputs').find('.txtStepTitle').val();
		if (typeof val !== 'undefined' && val != '') {
			stepsData[currentStep].title = String.prototype.trim.apply(val);
		}

		$('.windowWrapper').removeClass('editing');
		updateStepTitleInfo();
		updateChunksContent();
		storeStepsData();

		enableStepControlButtons();
	}
}

function addNewStepBefore() {
	if (!$('.windowWrapper').hasClass('editing')) {
		console.log("Adding new step before current step");

		var obj = generateCleanStepData();
		stepsData.splice(currentStep, 0, obj);

		updateStepTitleInfo();
		updateChunksContent();
		storeStepsData();
	}
}

function addNewStepAfter() {
	if (!$('.windowWrapper').hasClass('editing')) {
		console.log("Adding new step after current step");

		var obj = generateCleanStepData();
		stepsData.splice(currentStep + 1, 0, obj);
		currentStep += 1;

		updateStepTitleInfo();
		updateChunksContent();
		storeStepsData();
	}
}

function handleDeleteCurrentStep() {
	if (!$('.windowWrapper').hasClass('editing')) {
		showConfirmDialog({
			callback: deleteStep, 
			target: currentStep, 
			title:'Confirm Delete Step', 
			message: 'Are you sure you want to delete this script step? You will lose all content for this step and this action cannot be reversed.', 
			confirmText: 'Delete'
		});
	}
}

function deleteStep(idx) {
	console.log("Deleting step " + idx);

	stepsData.splice(idx, 1);
	if (currentStep >= stepsData.length) {
		currentStep = stepsData.length - 1;
	}

	updateStepTitleInfo();
	updateChunksContent();
	storeStepsData();
}

function handleSaveScript() {
	openFileDialog('save');
}

function saveScript(name) {
	if (name && name.length > 0) {
		console.log("Saving script: " + name);
		if (savedScripts.indexOf(name) === -1) {
			savedScripts.push(name);
			storeScriptsList();
		}
		storeScript(name);
	}
}

function handleOpenScript() {
	openFileDialog('open');
}

function openScript(name) {
	if (name && name.length > 0) {
		console.log("Opening script: " + name);
		Array.prototype.splice.apply(stepsData, [0, stepsData.length].concat(getScript(name)));
		currentStep = 0;
		updateStepTitleInfo();
		updateChunksContent();
		storeCurrentStep();
		storeStepsData();
	}
}

function deleteSavedScript(name) {
	if (name && name.length > 0) {
		console.log("Deleting script: " + name);
		removeScriptFromStorage(name);
		if (savedScripts.indexOf(name) !== -1) {
			savedScripts.splice(savedScripts.indexOf(name), 1);
			storeScriptsList();
		}
	}
}

function openFileDialog(action) {
	if (!$('.windowWrapper').hasClass('editing') && (action === 'save' || action === 'open')) {
		var $listContainer, $listitem
		var $blackout = $('.blackout');
		var $dialog = $('.dialog.fileDialog');
		var i, len;

		//set initial
		$blackout.addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$dialog.addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$blackout.get(0).offsetHeight; //trigger CSS reflow
		$dialog.get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$blackout.removeClass('noTransition').css({opacity: 1.0});
		$dialog.removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$dialog.data('action', action);
		$dialog.removeClass('save').removeClass('open');
		if (action === 'save') {
			$dialog.addClass('save');
		} else {
			$dialog.addClass('open');
		}
			//title
		if (action === 'save') {
			$dialog.find('h2').html('Save Script');
		} else {
			$dialog.find('h2').html('Open Script');
		}
			//text input
		if (action === 'save') {
			$dialog.find('.txtFileName').attr('label', 'Save As');
		} else {
			$dialog.find('.txtFileName').attr('label', 'Open');
		}
		$dialog.find('.txtFileName').val('');
			//setup list
		$listContainer = $dialog.find('ul.fileList');
		$listContainer.find('li').detach();
			//add list contents
		for (i = 0, len = savedScripts.length; i < len; i += 1) {
			$listItem = $('<li>' + 
					'<paper-icon-button class="btnDeleteFileItem" icon="delete"></paper-icon-button>' + 
					'<paper-item class="scriptName" icon="' + (action === 'save' ? 'save' : 'open') + '">' + savedScripts[i] + '</paper-item>' + 
				'</li>');
			$listItem.find('.scriptName').on('click', handleFileDialogItemClick);
			$listItem.find('.btnDeleteFileItem').on('click', handleFileDialogDeleteClick);
			$listContainer.append($listItem);
		}
			//done button
		if (action === 'save') {
			$dialog.find('.btnDone').attr('label', 'Save');
		} else {
			$dialog.find('.btnDone').attr('label', 'Open');
		}

		$dialog.find('.txtFileName').focus();
	}
}

function handleFileDialogItemClick(evt) {
	var $dialog = $('.dialog.fileDialog');
	var $listItem = $(evt.target).parents('li');
	$dialog.find('.txtFileName').val($listItem.find('.scriptName').text());
	$dialog.find('.txtFileName').focus();
}

function handleFileDialogDeleteClick(evt) {
	var $listItem = $(evt.target).parents('li');
	var scriptName = $listItem.find('.scriptName').text();
	showConfirmDialog({
		callback: function() {
			deleteSavedScript(scriptName);
			$listItem.detach();
		}, 
		title:'Confirm Script Delete', 
		message: 'Are you sure you want to permanently delete the script named \"' + scriptName + '\"? ' + 
			'You will lose all script content. This action cannot be reversed.', 
		confirmText: 'Delete'
	});
}

function handleFileDialogCancel(evt) {
	var $blackout = $('.blackout');
	var $dialog = $('.dialog.fileDialog');

	$dialog.removeClass('save').removeClass('open');

	//clear inputs
	$dialog.find('.txtFileName').val('');
	$dialog.find('ul.fileList').find('li').detach();
	$dialog.data('action', 'none');
	//fade out
	$blackout.css({opacity: 0.0});
	$dialog.css({opacity: 0.0, marginTop: 20});
	//deactivate
	setTimeout(function() {
		if ($dialog.data('action') === 'none') {
			$blackout.removeClass('active');
			$dialog.removeClass('active');
		}
	}, 400);
}

function handleFileDialogDone(evt) {
	var $blackout = $('.blackout');
	var $dialog = $('.dialog.fileDialog');
	var scriptName;

	$dialog.removeClass('save').removeClass('open');

	//take action
	scriptName = $dialog.find('.txtFileName').val().replace(/\s/g, ' ').trim();
	if ($dialog.data('action') === 'save') {
		saveScript(scriptName);
	} else if ($dialog.data('action') === 'open') {
		openScript(scriptName);
	}

	//clear inputs
	$dialog.find('.txtFileName').val('');
	$dialog.find('ul.fileList').find('li').detach();
	$dialog.data('action', 'none');
	//fade out
	$blackout.css({opacity: 0.0});
	$dialog.css({opacity: 0.0, marginTop: 20});
	//deactivate
	setTimeout(function() {
		if ($dialog.data('action') === 'none') {
			$blackout.removeClass('active');
			$dialog.removeClass('active');
		}
	}, 400);
}

function handleResetScript() {
	if (!$('.windowWrapper').hasClass('editing')) {
		showConfirmDialog({
			callback: resetScript, 
			title:'Confirm Script Reset', 
			message: 'Are you sure you want to reset the script to default content? You will lose all script content. This action cannot be reversed.', 
			confirmText: 'Reset'
		});
	}
}

function resetScript() {
	console.log("Resetting script to default content");
	Array.prototype.splice.apply(stepsData, [0, stepsData.length].concat(generateDefaultStepsData()));
	currentStep = 0;
	updateStepTitleInfo();
	updateChunksContent();
	storeCurrentStep();
	storeStepsData();
}

function handleClearScript() {
	if (!$('.windowWrapper').hasClass('editing')) {
		showConfirmDialog({
			callback: clearScript, 
			title:'Confirm Script Clear', 
			message: 'Are you sure you want to clear all script content? You will lose all script content. This action cannot be reversed.', 
			confirmText: 'Clear All'
		});
	}
}

function clearScript() {
	console.log("Clearing script content");
	var obj = [generateCleanStepData()];
	Array.prototype.splice.apply(stepsData, [0, stepsData.length].concat(obj));
	currentStep = 0;
	updateStepTitleInfo();
	updateChunksContent();
}

function deleteChunk(idx) {
	if (idx >= 0) {
		console.log("Deleting a chunk");

		stepsData[currentStep].contentChunks[idx] = {};
		stepsData[currentStep].contentChunks.splice(idx, 1);
		
		updateChunksContent();
		storeStepsData();
	}
}

function addTextChunk() {
	var idx = stepsData[currentStep].contentChunks.length;
	stepsData[currentStep].contentChunks.push({type: 'text', content: undefined});
	updateChunksContent();
	editTextChunk(idx);
}

function addLinkChunk() {
	var idx = stepsData[currentStep].contentChunks.length;
	stepsData[currentStep].contentChunks.push({type: 'link', content: {label: '', location: ''}});
	updateChunksContent();
	editLinkChunk(idx);
}

function addListChunk() {
	var idx = stepsData[currentStep].contentChunks.length;
	stepsData[currentStep].contentChunks.push({type: 'list', ordered: false, content: [' ']});
	updateChunksContent();
	editListChunk(idx);
}

function addTeamSplitChunk() {
	//TODO
}

//functions - script step content actions

function handlePostToTeamspeak(evt) {
	console.log("Posting message to TeamSpeak");

	var idx = $(evt.target).parents('li').index('li.chunk');
	pushTeamspeakMessage(getChunkContent(idx, true));
}

function handleCopyContent(evt) {
	console.log("Showing copy content dialog");

	var idx = $(evt.target).parents('li').index('li.chunk');
	var content = getChunkContent(idx, false);

	if (JSON.parse(window.localStorage.getItem('rn.settings.useClipboardPlugin'))) {
		//copy directly to clipboard (send to clipboard.js)
		window.localStorage.setItem('rn.clipboard.text', content);

		//TODO: show some feedback
	} else {
		//show popup with content
		var $blackout = $('.blackout');
		var $dialog = $('.dialog.copyDialog');
		var selection, range;

		//set initial
		$blackout.addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$dialog.addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$blackout.get(0).offsetHeight; //trigger CSS reflow
		$dialog.get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$blackout.removeClass('noTransition').css({opacity: 1.0});
		$dialog.removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$dialog.data('index', idx);
		$dialog.data('content', content);
			//content
		$dialog.find('.content').html(content);
		if (window.getSelection) {
			selection = window.getSelection();
			range = document.createRange();
			range.selectNodeContents($dialog.find('.content').get(0));
			selection.removeAllRanges();
			selection.addRange(range);
		}
			//reset button
		$dialog.find('.btnResetContent').on('click', handleCopyDialogReset);
	}
}

function handleCopyDialogReset(evt) {
	var $dialog = $('.dialog.copyDialog');
	var selection, range;

		$dialog.find('.content').html( $dialog.data('content') );
	if (window.getSelection) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents($dialog.find('.content').get(0));
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

function handleCopyDialogDone(evt) {
	var $blackout = $('.blackout');
	var $dialog = $('.dialog.copyDialog');
	var selection;

	//reset values
	$dialog.data('index', -1);
	$dialog.data('content', "");
		//content
	if (window.getSelection) {
		selection = window.getSelection();
		selection.removeAllRanges();
	}
		//reset button
	$dialog.find('.btnResetContent').off('click', handleCopyDialogReset);
	//fade out
	$blackout.css({opacity: 0.0});
	$dialog.css({opacity: 0.0, marginTop: 20});
	//deactivate
	setTimeout(function() {
		if ($dialog.data('index') === -1 && $dialog.data('content').length === 0) {
			$blackout.removeClass('active');
			$dialog.removeClass('active');
		}
	}, 400);
}

function getChunkContent(idx, formatForTS) {
	var content;
	var i, len;
	if (formatForTS) {
		switch (stepsData[currentStep].contentChunks[idx].type) {
			case 'text':
				return stepsData[currentStep].contentChunks[idx].content;
				break;
			case 'link':
				content = "";
				content += "[url=" + stepsData[currentStep].contentChunks[idx].content.location + "][u]";
				if (stepsData[currentStep].contentChunks[idx].content.label.replace(/\s/g, '').length > 0) {
					content += stepsData[currentStep].contentChunks[idx].content.label;
				} else {
					content += stepsData[currentStep].contentChunks[idx].content.location;
				}
				content += "[/u][/url]";
				return content;
				break;
			case 'list':
				content = "";
				for (i = 0, len = stepsData[currentStep].contentChunks[idx].content.length; i < len; i += 1) {
					content += "\r\n";
					if (stepsData[currentStep].contentChunks[idx].ordered) {
						content += "[b]" + (i+1) + ".[/b] ";
					} else {
						content += "[b] \u2219[/b] ";
					}
					content += stepsData[currentStep].contentChunks[idx].content[i];
				}
				return content;
				break;
		}
	} else {
		switch (stepsData[currentStep].contentChunks[idx].type) {
			case 'text':
				return stepsData[currentStep].contentChunks[idx].content;
				break;
			case 'link':
				return stepsData[currentStep].contentChunks[idx].content.location;
				break;
			case 'list':
				content = "";
				for (i = 0, len = stepsData[currentStep].contentChunks[idx].content.length; i < len; i += 1) {
					if (i > 0) {
						content += " // ";
					}
					if (stepsData[currentStep].contentChunks[idx].ordered) {
						content += "(" + (i+1) + ") ";
					}
					content += stepsData[currentStep].contentChunks[idx].content[i];
				}
				return content;
				break;
		}
	}
}

function handleOpenLink(evt) {
	console.log("Opening link");

	var idx = $(evt.target).parents('li').index('li.chunk');

	if (stepsData[currentStep].contentChunks[idx].type === 'link') {
		window.open(stepsData[currentStep].contentChunks[idx].content.location);
	}
}

//functions - script step content edit actions

function handleEditChunk(evt) {
	var idx = $(evt.target).parents('li').index('li.chunk');
	if (idx !== -1) {
		switch (stepsData[currentStep].contentChunks[idx].type) {
			case 'text':
				editTextChunk(idx);
				break;
			case 'link':
				editLinkChunk(idx);
				break;
			case 'list':
				editListChunk(idx);
				break;
			case 'split':
				editTeamSplitChunk(idx);
				break;
		}
	}
}

function handleDeleteChunk(evt) {
	var idx = $(evt.target).parents('li').index('li.chunk');
	if (idx !== -1) {
		showConfirmDialog({
			callback: deleteChunk, 
			target: idx, 
			title:'Confirm Delete Content', 
			message: 'Are you sure you want to delete this content? This action cannot be reversed.',
			confirmText: 'Delete'
		});
	}
}

function handleRearrangeChunk(evt) {
	//TODO
}

function editTextChunk(idx) {
	if (stepsData[currentStep].contentChunks[idx].type === 'text') {
		//set initial
		$('.blackout').addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$('.dialog.editTextChunk').addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$('.blackout').get(0).offsetHeight; //trigger CSS reflow
		$('.dialog.editTextChunk').get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$('.blackout').removeClass('noTransition').css({opacity: 1.0});
		$('.dialog.editTextChunk').removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$('.dialog.editTextChunk').data('editing', idx);
		$('.dialog.editTextChunk').find('.txtTextContent').val(stepsData[currentStep].contentChunks[idx].content).focus();
	}
}

function applyTextChunkEdits() {
	var idx = $('.dialog.editTextChunk').data('editing');
	if (stepsData[currentStep].contentChunks[idx].type === 'text') {
		//update values
		stepsData[currentStep].contentChunks[idx].content = $('.dialog.editTextChunk').find('.txtTextContent').val();
		$('.dialog.editTextChunk').data('editing', -1);
		//fade out
		$('.blackout').css({opacity: 0.0});
		$('.dialog.editTextChunk').css({opacity: 0.0, marginTop: 20});
		//deactivate
		setTimeout(function() {
			if ($('.dialog.editTextChunk').data('editing') === -1) {
				$('.blackout').removeClass('active');
				$('.dialog.editTextChunk').removeClass('active');
			}
		}, 400);
	}
}

function editLinkChunk(idx) {
	if (stepsData[currentStep].contentChunks[idx].type === 'link') {
		//set initial
		$('.blackout').addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$('.dialog.editLinkChunk').addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$('.blackout').get(0).offsetHeight; //trigger CSS reflow
		$('.dialog.editLinkChunk').get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$('.blackout').removeClass('noTransition').css({opacity: 1.0});
		$('.dialog.editLinkChunk').removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$('.dialog.editLinkChunk').data('editing', idx);
		$('.dialog.editLinkChunk').find('.txtLinkTitle').val(stepsData[currentStep].contentChunks[idx].content.label).focus();
		$('.dialog.editLinkChunk').find('.txtLinkLocation').val(stepsData[currentStep].contentChunks[idx].content.location);
	}
}

function applyLinkChunkEdits() {
	var idx = $('.dialog.editLinkChunk').data('editing');
	var val;
	if (stepsData[currentStep].contentChunks[idx].type === 'link') {
		//update values
		stepsData[currentStep].contentChunks[idx].content.label = $('.dialog.editLinkChunk').find('.txtLinkTitle').val();
		val = $('.dialog.editLinkChunk').find('.txtLinkLocation').val();
		if (val.indexOf('http://') !== 0 && val.indexOf('https://') !== 0) {
			if (val.indexOf('://') !== -1) {
				val = val.split('://')[val.split('://').length - 1];
			}
			val = 'http://' + val;
		}
		stepsData[currentStep].contentChunks[idx].content.location = val;
		$('.dialog.editLinkChunk').data('editing', -1);
		//fade out
		$('.blackout').css({opacity: 0.0});
		$('.dialog.editLinkChunk').css({opacity: 0.0, marginTop: 20});
		//deactivate
		setTimeout(function() {
			if ($('.dialog.editLinkChunk').data('editing') === -1) {
				$('.blackout').removeClass('active');
				$('.dialog.editLinkChunk').removeClass('active');
			}
		}, 400);
	}
}

function editListChunk(idx) {
	if (stepsData[currentStep].contentChunks[idx].type === 'list') {
		var $listContainer, $listitem, $checkbox;
		var $blackout = $('.blackout');
		var $dialog = $('.dialog.editListChunk');
		var i, len;

		//set initial
		$blackout.addClass('noTransition').css({opacity: 0.0}).addClass('active');
		$dialog.addClass('noTransition').css({opacity: 0.0, marginTop: 20}).addClass('active');
		$blackout.get(0).offsetHeight; //trigger CSS reflow
		$dialog.get(0).offsetHeight; //trigger CSS reflow
		//fade in
		$blackout.removeClass('noTransition').css({opacity: 1.0});
		$dialog.removeClass('noTransition').css({opacity: 1.0, marginTop: 0});
		//init values
		$dialog.data('editing', idx);
			//text input
		$dialog.find('.txtListItemContent').val(' ');
			//setup list
		$dialog.find('.listContainer').removeClass('selected').find('li').detach();
		if (stepsData[currentStep].contentChunks[idx].ordered) {
			$listContainer = $('ol.orderedItemList');
		} else {
			$listContainer = $('ul.unorderedItemList');
		}
		$listContainer.addClass('selected');
			//add list contents
		for (i = 0, len = stepsData[currentStep].contentChunks[idx].content.length; i < len; i += 1) {
			$listItem = $('<li>' + 
					'<br/>' + 
					'<paper-icon-button class="btnDeleteListItem" icon="delete"></paper-icon-button>' + 
					'<span class="listItemContent">' + 
						stepsData[currentStep].contentChunks[idx].content[i] + 
					'</span>' + 
				'</li>');
			$listItem.find('.listItemContent').on('click', handleEditListChunkItemClick);
			$listItem.find('.btnDeleteListItem').on('click', handleEditListChunkDeleteItem);
			$listContainer.append($listItem);
		}
			//add more button
		$dialog.find('.btnAddListItem').on('click', handleEditListChunkAddItem);
			//checkbox
		$checkbox = $('<paper-checkbox class="checkboxOrdered" ' + 
			(stepsData[currentStep].contentChunks[idx].ordered ? 'checked ' : '') + 
			'label="Numbered list"></paper-checkbox>');
		$checkbox.on('change', handleEditListChunkOrderedFlagChanged);
		$dialog.find('h2').after($checkbox);
	}
}

function handleEditListChunkItemClick(evt) {
	var $listItem = $(evt.target).parent();
	var $dialog = $('.dialog.editListChunk');
	var $textInput = $dialog.find('.txtListItemContent');

	if ($dialog.find('li.editing').length > 0) {
		$dialog.find('li.editing').find('.listItemContent').html($textInput.val());
		$dialog.find('li.editing').removeClass('editing');
	}

	$listItem.append($textInput.detach());
	$textInput.val('');
	$listItem.addClass('editing');
	$textInput.val($listItem.find('.listItemContent').html().trim());
	$textInput.focus();
}

function handleEditListChunkDeleteItem(evt) {
	var $listItem = $(evt.target).parent();
	var $dialog = $('.dialog.editListChunk');

	if ($listItem.find('txtListItemContent').length > 0) {
		$dialog.find('.txtListItemContent').val('');
		$dialog.append($dialog.find('.txtListItemContent').detach());
	}

	$listItem.detach();
}

function handleEditListChunkAddItem(evt) {
	var $listItem;
	var $dialog = $('.dialog.editListChunk');
	var $textInput = $dialog.find('.txtListItemContent');

	$listItem = $('<li>' + 
			'<br/>' + 
			'<paper-icon-button class="btnDeleteListItem" icon="delete"></paper-icon-button>' + 
			'<span class="listItemContent"></span>' + 
		'</li>');
	$listItem.find('.listItemContent').on('click', handleEditListChunkItemClick);
	$listItem.find('.btnDeleteListItem').on('click', handleEditListChunkDeleteItem);
	$dialog.find('.listContainer.selected').append($listItem);

	if ($dialog.find('li.editing').length > 0) {
		$dialog.find('li.editing').find('.listItemContent').html($textInput.val());
		$dialog.find('li.editing').removeClass('editing');
	}
	$textInput.detach();

	$listItem.append($textInput);
	$textInput.val($listItem.find('.listItemContent').html());
	$listItem.addClass('editing');
	$textInput.focus();
}

function handleEditListChunkOrderedFlagChanged(evt) {
	var $listContainer;
	var $listItems;

	$listContainer = $('.dialog.editListChunk').find('.listContainer.selected');
	$listItems = $listContainer.find('li').detach();
	$listContainer.removeClass('selected');

	if ($('.checkboxOrdered').attr('checked') === 'checked') {
		$listContainer = $('ol.orderedItemList');
	} else {
		$listContainer = $('ul.unorderedItemList');
	}
	$listContainer.addClass('selected').append($listItems);
}

function applyListChunkEdits() {
	var $dialog = $('.dialog.editListChunk');
	var $blackout = $('.blackout');
	var idx = $dialog.data('editing');
	var vals;
	if (stepsData[currentStep].contentChunks[idx].type === 'list') {
		//update values
		vals = [];
		$dialog.find('.listContainer.selected').find('li').each(function(i, el) {
			if ($(el).hasClass('editing')) {
				vals.push($(el).find('.txtListItemContent').val().trim());
			} else {
				vals.push($(el).find('.listItemContent').html().trim());
			}
		});
		stepsData[currentStep].contentChunks[idx].ordered = $dialog.find('.listContainer.selected').is('.orderedItemList');
		stepsData[currentStep].contentChunks[idx].content = vals;
		//clear inputs
		$dialog.find('.btnAddListItem').off('click', handleEditListChunkAddItem);
		$dialog.find('.checkboxOrdered').detach();
		$dialog.find('.txtListItemContent').val('');
		$dialog.append($('.dialog.editListChunk').find('.txtListItemContent').detach());
		$dialog.find('.listContainer').removeClass('selected').find('li').detach();
		$dialog.data('editing', -1);
		//fade out
		$blackout.css({opacity: 0.0});
		$dialog.css({opacity: 0.0, marginTop: 20});
		//deactivate
		setTimeout(function() {
			if ($dialog.data('editing') === -1) {
				$blackout.removeClass('active');
				$dialog.removeClass('active');
			}
		}, 400);
	}
}

function editTeamSplitChunk(idx) {
	//TODO
}

function applyTeamSplitChunkEdits() {
	//TODO
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
			$dialog.find('.title').html('Confirm Delete');
		}
		if (typeof options.message !== 'undefined') {
			$dialog.find('.message').html(options.message);
		} else {
			$dialog.find('.message').html('Are you sure you want to delete this?');
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
	navigator.plugins.refresh(true);
	
	//button actions
		//toolbar actions
	//$('.btnEditStep').on('click', editCurrentStep); //handled through @onlick in markup due to templating issues
	//$('.btnAddStepBefore').on('click', addNewStepBefore); //handled through @onlick in markup due to templating issues
	//$('.btnAddStepAfter').on('click', addNewStepAfter); //handled through @onlick in markup due to templating issues
	//$('.btnDeleteStep').on('click', handleDeleteCurrentStep); //handled through @onlick in markup due to templating issues
	//$('.btnSave').on('click', handleSaveScript); //handled through @onlick in markup due to templating issues
	//$('.btnOpen').on('click', handleOpenScript); //handled through @onlick in markup due to templating issues
	//$('.btnResetScript').on('click', resetScript); //handled through @onlick in markup due to templating issues
	$('#btnClose').on('click', closeWindow);
		//step control actions
	enableStepControlButtons();
		//chunk actions
	$('body').on('click', '.btnPostToTeamspeak', handlePostToTeamspeak);
	$('body').on('click', '.btnCopyContent', handleCopyContent);
	$('body').on('click', '.btnOpenLink', handleOpenLink);
		//chunk edit actions
	$('body').on('click', '.btnEditChunk', handleEditChunk);
	$('body').on('click', '.btnDeleteChunk', handleDeleteChunk);
	//$('body').on('mousedown', '.btnRearrangeChunk', handleRearrangeChunk); //TODO
	$('.btnAddText').on('click', addTextChunk);
	$('.btnAddLink').on('click', addLinkChunk);
	$('.btnAddList').on('click', addListChunk);
	//$('.btnAddTeamSplit').on('click', addTeamSplitChunk); //TODO: uncomment when feature is complete
	$('.btnDoneEditing').on('click', saveStepEdits);
		//dialog actions
	$('.copyDialog .btnDone').on('click', handleCopyDialogDone);
	$('.fileDialog .btnCancel').on('click', handleFileDialogCancel);
	$('.fileDialog .btnDone').on('click', handleFileDialogDone);
	$('.editTextChunk .btnDone').on('click', applyTextChunkEdits);
	$('.editLinkChunk .btnDone').on('click', applyLinkChunkEdits);
	$('.editListChunk .btnDone').on('click', applyListChunkEdits);
	$('.editTeamSplitChunk .btnDone').on('click', applyTeamSplitChunkEdits);
	$('.confirmDialog .btnCancel').on('click', handleConfirmDialogCancel);
	$('.confirmDialog .btnConfirm').on('click', handleConfirmDialogConfirm);

	//storage
	//window.addEventListener('storage', handleStorage, false); //not currently needed
	//get initial script content
	stepsData = getStepsData();
	if (!stepsData.length) {
		//default stepsData content
		stepsData = generateDefaultStepsData();
	}
	currentStep = getCurrentStep();
	//get saved scripts list
	savedScripts = getScriptsList();

	// //set up step chunk actions and observer to monitor for when to add evemts after the list mutates
	// var observer = MutationObserver(function(mutations) {
	// 	mutations.forEach(handleChunksListMutation);
	// });
	// observer.observe(document.querySelector('ul.stepChunksList'), { childList: true });

	//template binding
	updateStepTitleInfo();
	updateChunksContent();


});
