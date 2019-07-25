//listens to button press
//ideally: button toggles listener on and off -> another listens for board changes
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if( request.message === 'start') {
    	runAnalysis();
    }
});







function runAnalysis(){
	let theBoard = $('.board').find('.pieces')
	if (theBoard.length){
		//alert("Analyzing position: " + theBoard.children()[0].className.split(" ")[1])
		//alert("The white king is on: " + theBoard.find("#piece-5").attr("class").split(" ")[1])
		
		var arr = []
		theBoard.children().toArray().forEach(function(c){
			var col = cdcMap[c.id][0];
			var name = cdcMap[c.id][1];
			var conv = convertCoodinates(c.className.split(" ")[1].split("-")[1]);
			var x = conv[0];
			var y = conv[1];

			var piece = new Piece(col, name, x, y)
			arr.push(piece)
		});
		var looseHang = getLooseHanging(arr);
		
		//bring 'looseHang' info back to the board
		console.log(looseHang)
		

	} else {
		alert('You are not in a game!')
	}
}






///////////////////////////////////////////////////////////////////////////////////////////
//CHESS STUFF

chessBoard = [];

class Piece {
  constructor(colour, name, x, y) {
  	this.colour = colour;
    this.name = name;
    this.x = x
    this.y = y
    this.attackers = 0;
    this.defenders = 0;
  }
} 


function getLooseHanging(pieces){
	init(pieces); //make position
	annotateWeaknesses(); //annotate pieces

	//go through the board and return hanging and loose pieces
	loosePieces = []
	hangingPieces = []
	for (var i = 0; i < 8; i++){
		for (var j = 0; j < 8; j++){
			piece = chessBoard[i][j];
			if (piece == null || piece.name == 'king'){
				continue;
			}
			if (piece.defenders < piece.attackers){
				hangingPieces.push(piece);
			} else if (piece.defenders == 0){
				loosePieces.push(piece);
			}
		}
	}
	chessBoard = []
	return {'loose' : loosePieces, 'hanging' : hangingPieces};
}


function init(pieces){
	for (var i = 0; i < 8; i++){
		chessBoard.push([null, null, null, null, null, null, null, null,]);
	}
	pieces.forEach(function(p){
		chessBoard[p.y][p.x] = p;
	});
}


function annotateWeaknesses(){
	//check what piece it is -> send it in the proper directions
	for (var i = 0; i < 8; i++){
		for (var j = 0; j < 8; j++){
			piece = chessBoard[i][j];
			if (piece == null){
				continue;
			}
			switch (piece.name){
				case 'king':
					annotateNext(piece.colour, piece.x, piece.y - 1, '-');
					annotateNext(piece.colour, piece.x, piece.y + 1, '-');
					annotateNext(piece.colour, piece.x - 1, piece.y, '-');
					annotateNext(piece.colour, piece.x + 1, piece.y, '-');
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, '-');
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, '-');
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, '-');
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, '-');
					break;

				case 'queen':
					annotateNext(piece.colour, piece.x, piece.y - 1, 'N');
					annotateNext(piece.colour, piece.x, piece.y + 1, 'S');
					annotateNext(piece.colour, piece.x - 1, piece.y, 'W');
					annotateNext(piece.colour, piece.x + 1, piece.y, 'E');
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, 'NW');
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, 'NE');
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, 'SW');
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, 'SE');
					break;

				case 'rook':
					annotateNext(piece.colour, piece.x, piece.y - 1, 'N');
					annotateNext(piece.colour, piece.x, piece.y + 1, 'S');
					annotateNext(piece.colour, piece.x - 1, piece.y, 'W');
					annotateNext(piece.colour, piece.x + 1, piece.y, 'E');
					break;

				case 'bishop':
					annotateNext(piece.colour, piece.x - 1, piece.y - 1, 'NW');
					annotateNext(piece.colour, piece.x + 1, piece.y - 1, 'NE');
					annotateNext(piece.colour, piece.x - 1, piece.y + 1, 'SW');
					annotateNext(piece.colour, piece.x + 1, piece.y + 1, 'SE');
					break;

				case 'knight':
					annotateNext(piece.colour, piece.x - 2, piece.y - 1, '-');
					annotateNext(piece.colour, piece.x - 1, piece.y - 2, '-');
					annotateNext(piece.colour, piece.x + 1, piece.y - 2, '-');
					annotateNext(piece.colour, piece.x + 2, piece.y - 1, '-');
					annotateNext(piece.colour, piece.x - 2, piece.y + 1, '-');
					annotateNext(piece.colour, piece.x - 1, piece.y + 2, '-');
					annotateNext(piece.colour, piece.x + 1, piece.y + 2, '-');
					annotateNext(piece.colour, piece.x + 2, piece.y + 1, '-');
					break;

				case 'pawn':
					if (piece.colour == 'w'){
						annotateNext(piece.colour, piece.x - 1, piece.y - 1, '-');
						annotateNext(piece.colour, piece.x + 1, piece.y - 1, '-');
					} else {
						annotateNext(piece.colour, piece.x - 1, piece.y + 1, '-');
						annotateNext(piece.colour, piece.x + 1, piece.y + 1, '-');
					}
					break;
				default:
					break;
			}
		}
	}
}


function annotateNext(col, curX, curY, dir){
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
			curPiece.defenders++;
		} else {
			curPiece.attackers++;
		}
		return;

	//if there is an empty square, go to the next square
	} else {
		switch (dir){
			case 'N':
				annotateNext(col, curX, curY - 1, dir)
				break;
			case 'S':
				annotateNext(col, curX, curY + 1, dir)
				break;
			case 'W':
				annotateNext(col, curX - 1, curY, dir)
				break;
			case 'E':
				annotateNext(col, curX + 1, curY, dir)
				break;
			case 'NW':
				annotateNext(col, curX - 1, curY - 1, dir)
				break;
			case 'NE':
				annotateNext(col, curX + 1, curY - 1, dir)
				break;
			case 'SW':
				annotateNext(col, curX - 1, curY + 1, dir)
				break;
			case 'SE':
				annotateNext(col, curX + 1, curY + 1, dir)
				break;
			default:
				break;
		}
		return;
	}
}







///////////////////////////////////////////////////////////////////////////////////////////
//conversions
function convertCoodinates(cdcStr){
	var x = parseInt(cdcStr.substring(1,2), 10) - 1;
	var y = 8 - parseInt(cdcStr.substring(3,4), 10);
	return [x,y]
}

var cdcMap = {
	'piece-1' : ['w', 'rook'],
	'piece-2' : ['w', 'knight'],
	'piece-3' : ['w', 'bishop'],
	'piece-4' : ['w', 'queen'],
	'piece-5' : ['w', 'king'],
	'piece-6' : ['w', 'bishop'],
	'piece-7' : ['w', 'knight'],
	'piece-8' : ['w', 'rook'],
	'piece-9' : ['w', 'pawn'],
	'piece-10' : ['w', 'pawn'],
	'piece-11' : ['w', 'pawn'],
	'piece-12' : ['w', 'pawn'],
	'piece-13' : ['w', 'pawn'],
	'piece-14' : ['w', 'pawn'],
	'piece-15' : ['w', 'pawn'],
	'piece-16' : ['w', 'pawn'],
	'piece-17' : ['b', 'pawn'],
	'piece-18' : ['b', 'pawn'],
	'piece-19' : ['b', 'pawn'],
	'piece-20' : ['b', 'pawn'],
	'piece-21' : ['b', 'pawn'],
	'piece-22' : ['b', 'pawn'],
	'piece-23' : ['b', 'pawn'],
	'piece-24' : ['b', 'pawn'],
	'piece-25' : ['b', 'rook'],
	'piece-26' : ['b', 'knight'],
	'piece-27' : ['b', 'bishop'],
	'piece-28' : ['b', 'queen'],
	'piece-29' : ['b', 'king'],
	'piece-30' : ['b', 'bishop'],
	'piece-31' : ['b', 'knight'],
	'piece-32' : ['b', 'rook'],
}


