chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if( request.message === "start" ) {
    	checkChess();
    }
});


function checkChess(){
	let theBoard = $(".board").find(".pieces")
	if (theBoard.length){
		//alert("Analyzing position: " + theBoard.children()[0].className.split(" ")[1])
		alert("The white king is on: " + theBoard.find("#piece-5").attr("class").split(" ")[1])

	} else {
		alert("You aren't in a game!")
	}
}

