//listens to analyze button press
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if( request.message === 'start') {
    	runAnalysis();
    }
});


//listens to ctrl+shift+L keypress 
if (window == top) {
	window.addEventListener('keyup', doKeyPress, false); //add the keyboard handler
}
trigger_key = 72; 


function doKeyPress(e){
	if (e.shiftKey && e.keyCode == trigger_key){ 
		runAnalysis();
	}
}


function runAnalysis(){
	//find orientation
	orient = ""
	if ($('.main-board').find("coords")[0].classList.length > 1){
		orient = 'black'
	} else {
		orient = 'white'
	}

	//chess board
	let theBoard = $('.main-board').find("cg-board")
	if (theBoard.length){		
		//find translate multiple
		multiple = theBoard[0].offsetHeight / 8

		var piecesArr = [];
		for (var i = 0; i < theBoard.children().length; i++){
			c = theBoard.children()[i];

			if (c.classList[0] == 'last-move' || c.classList[0] == 'move-dest' || c.classList[0] == 'hanging' || c.classList[0] == 'loose'){
				continue;
			}

			var col = c.classList[0];
			var name = c.classList[1];
			var x = getXTranslate(c, multiple); 				//c.cgKey.charCodeAt(0) - 97
			var y = getYTranslate(c, multiple);					//8 - parseInt(c.cgKey.charAt(1))

			var piece = new Piece(col, name, x, y, valueMap[name]);
			piecesArr.push(piece);
		}
		var looseHanging = getLooseHanging(piecesArr, orient);
		
		//bring 'looseHang' info back to the board
		console.log(looseHanging);

		looseHanging['loose'].forEach(function(piece){
			var x = piece.x * multiple
			var y = piece.y * multiple
			theBoard.append("<square class='loose' style='transform: translate("+x+"px, "+y+"px); background-color:rgba(255,165,0,0.7)'></square>")
		});
		looseHanging['hanging'].forEach(function(piece){
			var x = piece.x * multiple
			var y = piece.y * multiple
			theBoard.append("<square class='hanging' style='transform: translate("+x+"px, "+y+"px); background-color:rgba(255,0,0,0.7)'></square>")
		});
		


	} else {
		alert('You are not in a game!');
	}
}


///////////////////////////////////////////////////////////////////////////////////////////
//CHESS STUFF

var chessBoard = [];

class Piece {
  constructor(colour, name, x, y, value) {
  	this.colour = colour;
    this.name = name;
    this.x = x;
    this.y = y;
    this.value = value;
    this.numAttackers = 0;
    this.numDefenders = 0;
    this.attackerVals = [];
    this.defenderVals = [];
/*
    function getDefenderVal(){
    	return this.value + Math.sum(...this.defenderVals) - Math.max(...this.defenderVals);
    }
    function getAttackerVal(){
    	return Math.sum(...this.attackerVals);
    }
*/}

  isDefended = function(){
  		var total = 0;
    	this.attackerVals.sort();
    	this.defenderVals.sort();
    	this.defenderVals.unshift(this.value);
    	while (this.attackerVals.length > 0){
    		total -= this.defenderVals.shift();
    		if (this.defenderVals.length > 0){
    			total += this.attackerVals.shift();
    			if (total < 0){
    				return false;
    			}
    		} else {
    			break;
    		}
    	}

    	return total >= 0;
  	}

  
} 


function getLooseHanging(pieces, orient){
	init(pieces); //make position
	annotateWeaknesses(orient); //annotate pieces

	//go through the board and return hanging and loose pieces
	loosePieces = []
	hangingPieces = []
	for (var i = 0; i < 8; i++){
		for (var j = 0; j < 8; j++){
			piece = chessBoard[i][j];
			if (piece == null || piece.name == 'king'){
				continue;
			}
			if (!piece.isDefended()){
				hangingPieces.push(piece);
			} else if (piece.numDefenders == 0){
				loosePieces.push(piece);
			}
		}
	}
	chessBoard = []
	return {'loose' : loosePieces, 'hanging' : hangingPieces};
}


function init(pieces){
	chessBoard = []
	for (var i = 0; i < 8; i++){
		chessBoard.push([null, null, null, null, null, null, null, null,]);
	}
	pieces.forEach(function(p){
		chessBoard[p.y][p.x] = p;
	});
}


function annotateWeaknesses(orient){
	//check what piece it is -> send it in the proper directions
	for (var i = 0; i < 8; i++){
		for (var j = 0; j < 8; j++){
			piece = chessBoard[i][j];
			if (piece == null){
				continue;
			}
			switch (piece.name){
				case 'king':
					annotateNext(piece.colour, piece.x, piece.y - 1, '-', piece.value);
					annotateNext(piece.colour, piece.x, piece.y + 1, '-', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y, '-', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y, '-', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, '-', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, '-', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, '-', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, '-', piece.value);
					break;

				case 'queen':
					annotateNext(piece.colour, piece.x, piece.y - 1, 'N', piece.value);
					annotateNext(piece.colour, piece.x, piece.y + 1, 'S', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y, 'W', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y, 'E', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, 'NW', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, 'NE', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, 'SW', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, 'SE', piece.value);
					break;

				case 'rook':
					annotateNext(piece.colour, piece.x, piece.y - 1, 'N', piece.value);
					annotateNext(piece.colour, piece.x, piece.y + 1, 'S', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y, 'W', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y, 'E', piece.value);
					break;

				case 'bishop':
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, 'NW', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, 'NE', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, 'SW', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, 'SE', piece.value);
					break;

				case 'knight':
					annotateNext(piece.colour, piece.x - 2, piece.y - 1, '-', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y - 2, '-', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y - 2, '-', piece.value);
					annotateNext(piece.colour, piece.x + 2, piece.y - 1, '-', piece.value);
					annotateNext(piece.colour, piece.x - 2, piece.y + 1, '-', piece.value);
					annotateNext(piece.colour, piece.x - 1, piece.y + 2, '-', piece.value);
					annotateNext(piece.colour, piece.x + 1, piece.y + 2, '-', piece.value);
					annotateNext(piece.colour, piece.x + 2, piece.y + 1, '-', piece.value);
					break;

				case 'pawn':
					if (piece.colour == orient){
						annotateNext(piece.colour, piece.x - 1, piece.y - 1, '-', piece.value);
						annotateNext(piece.colour, piece.x + 1, piece.y - 1, '-', piece.value);
					} else {
						annotateNext(piece.colour, piece.x - 1, piece.y + 1, '-', piece.value);
						annotateNext(piece.colour, piece.x + 1, piece.y + 1, '-', piece.value);
					}
					break;
				default:
					break;
			}
		}
	}
}


function annotateNext(col, curX, curY, dir, val){
	//if out of bounds
	if (curX < 0 || curX > 7 || curY < 0 || curY > 7){
		return;
	}

	curPiece = chessBoard[curY][curX];

	//if there is a piece
	if (curPiece != null){
		//no annotation on king
		if (curPiece.name == "king"){
			return;
		}

		if (curPiece.colour == col){
			curPiece.numDefenders++;
			curPiece.defenderVals.push(val);

		} else {
			curPiece.numAttackers++;
			curPiece.attackerVals.push(val);
		}
		return;

	//if there is an empty square, go to the next square
	} else {
		switch (dir){
			case 'N':
				annotateNext(col, curX, curY - 1, dir, val)
				break;
			case 'S':
				annotateNext(col, curX, curY + 1, dir, val)
				break;
			case 'W':
				annotateNext(col, curX - 1, curY, dir, val)
				break;
			case 'E':
				annotateNext(col, curX + 1, curY, dir, val)
				break;
			case 'NW':
				annotateNext(col, curX - 1, curY - 1, dir, val)
				break;
			case 'NE':
				annotateNext(col, curX + 1, curY - 1, dir, val)
				break;
			case 'SW':
				annotateNext(col, curX - 1, curY + 1, dir, val)
				break;
			case 'SE':
				annotateNext(col, curX + 1, curY + 1, dir, val)
				break;
			default:
				break;
		}
		return;
	}
}








///////////////////////////////////////////////////////////////////////////////////////////
//helpers 


function convertCoodinates(cdcStr){
	var x = parseInt(cdcStr.substring(1,2), 10) - 1;
	var y = 8 - parseInt(cdcStr.substring(3,4), 10);
	return [x,y]
}


function getXTranslate(piece, multiple){
	return parseInt(piece.style.cssText.split('(')[1].split('p')[0]) / multiple;
}

function getYTranslate(piece, multiple){
	return parseInt(piece.style.cssText.split(' ')[2].split('p')[0]) / multiple;
}



var valueMap = {
	"pawn" : 1,
	"knight" : 3,
	"bishop" : 3,
	"rook" : 5,
	"queen" : 9,
	"king"	: 999999
}




