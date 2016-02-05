
var clipboard; //reference to clipboard plugin

//functions - storage

function handleClipboardStorage(evt) {
	switch (evt.key) {
		case 'rn.clipboard.text':
			handleClipboardText(evt.newValue);
			break;
		default:
			break;
	}
}

function handleClipboardText(str) {
	console.log("Text received. Copying to clipboard: " + str);
	
	clipboard.set(str);
	window.localStorage.setItem('rn.clipboard.text', '');
}

//init
(function init() {
	console.log("CLIPBOARD.JS INIT");

	//events
	window.addEventListener('storage', handleClipboardStorage, false);

	clipboard = document.getElementById("clipboardPlugin");
}());
