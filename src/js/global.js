//global variables
var currentWindow;

//functions
function closeWindow() {
	if (typeof currentWindow !== 'undefined') {
		overwolf.windows.close(currentWindow);
	}
}

function beginDragMove() {
	if (typeof currentWindow !== 'undefined') {
		overwolf.windows.dragMove(currentWindow);
	}
}

//init
$(document).ready(function init() {
	//current window ID
	overwolf.windows.getCurrentWindow(function withCurrentWindow(res) {
		//handle error
		if (res.status !== 'success') {
			console.log('Unable to get current window');
			console.log(res);
		}
		currentWindow = res.window.id;
	});

	//button actions
	$('.windowDragGrip').on('mousedown', beginDragMove);
	$('.btnCloseWindow').on('click', closeWindow);
});