var keyCodes = {
	37: "left",
	38: "up",
	39: "right",
	40: "down",
	72: "left",
	75: "up",
	76: "right",
	74: "down"
};

function Game(display, rows, cols) {
	this.rows = rows || 4;
	this.cols = cols || 4;
	this.numStartTiles = 2;
	this.goal = 2048;
	this.plan = [];
	for (var i = 0; i < this.rows; i++) {
		this.plan.push([]);
		for (var j = 0; j < this.cols; j++) {
			this.plan[i][j] = 0;
		}
	}
	this.ended = false;
	this.paused = false;
	this.display = display;
}

Game.prototype.clear = function() {
	this.goal = 2048;
	this.ended = false;
	this.paused = false;
	this.display.clear();
	for (var i = 0; i < this.rows; i++) {
		for (var j = 0; j < this.cols; j++) {
			this.plan[i][j] = 0;
		}
	}
};

Game.prototype.withinBounds = function(x, y) {
	return (x >= 0 && y >= 0 &&
			x < this.rows && y < this.cols);
};

Game.prototype.start = function() {
	this.clear();
	for (var i = 0; i < this.numStartTiles; i++) {
		this.addRandomTile();
	}
};

Game.prototype.pause = function(state) {
	this.paused = (state === 0) ? true : false;
};

Game.prototype.addRandomTile = function() {
	if (this.ended || this.paused)
		return;

	var randomIndex, rowIndex, colIndex;
		tileContent = Math.random() > 0.3 ? 2 : 4;

	do {
		randomIndex	= Math.floor(Math.random() * this.cols * this.rows);
		rowIndex = Math.floor(randomIndex / this.rows);
		colIndex = randomIndex % this.cols;
	} while(this.plan[rowIndex][colIndex] !== 0);

	this.plan[rowIndex][colIndex] = tileContent;
	this.display.newTile(this.plan, rowIndex, colIndex);

	this.checkResult();
};

Game.prototype.move = function(direction) {
	if (this.ended || this.paused)
		return;

	var that = this,
		planCopy = this.plan.slice(),
		didMerge = [],
		madeAMove = false,
		i, j;

	function next(currIndex) {
		var vect = {
			x: currIndex.x,
			y: currIndex.y
		};
		switch (direction) {
			case "up":
				vect.x = currIndex.x - 1;
				break;
			case "down":
				vect.x = currIndex.x + 1;
				break;
			case "left":
				vect.y = currIndex.y - 1;
				break;
			case "right":
				vect.y = currIndex.y + 1;
				break;
		}
		return vect;
	}

	function planValue(indexVect) {
		if (!that.withinBounds(indexVect.x, indexVect.y))
			return undefined;

		return that.plan[indexVect.x][indexVect.y];
	}

	function updateTile(i, j) {
		var dest = {x: i, y: j},
			nextDest,
			shouldChange = false;
			val = that.plan[i][j];

		if (planCopy[i][j] === 0)
			return;

		while (planValue(next(dest)) === 0) {
			dest = next(dest);
			madeAMove = true;
			shouldChange = true;
		}

		nextDest = next(dest);
		if (planValue(nextDest) === val && !didMerge[nextDest.x][nextDest.y]) {
			dest = nextDest;
			didMerge[nextDest.x][nextDest.y] = true;
			madeAMove = true;
			shouldChange = true;
		}

		if (shouldChange) {
			that.plan[i][j] = 0;
			that.plan[dest.x][dest.y] += val;
			that.display.moveTile(that.plan, i, j, dest.x, dest.y);
		}
	}

	if (direction === "up" || direction === "left") {
		for (i = 0; i < this.rows; i++) {
			didMerge[i] = [];
			for (j = 0; j < this.cols; j++) {
				updateTile(i, j);
			}
		}
	} else {
		for (i = this.rows - 1; i >= 0; i--) {
			didMerge[i] = [];
			for (j = this.cols - 1; j >= 0; j--) {
				updateTile(i, j);
			}
		}
	}

	if (madeAMove)
		this.addRandomTile();
};

Game.prototype.checkResult = function() {
	var planFull = true;
	var highestTile = 0;
	this.plan.forEach(function(row) {
		row.forEach(function(val) {
			if (val === this.goal) {
				this.pause(0);
				this.display.result(1, this.goal);
				this.goal *= 2;
			} else if (val === 0) {
				planFull = false;
			}
		}, this);
	}, this);

	if (planFull) {
		for (var i = 0; i < this.rows; i++) {
			for (var j = 0; j < this.cols; j++) {
				if (this.withinBounds(i, j + 1) && this.plan[i][j] === this.plan[i][j + 1] ||
					this.withinBounds(i + 1, j) && this.plan[i][j] === this.plan[i + 1][j]) {
					return;
				}
				highestTile = (this.plan[i][j] > highestTile) ? this.plan[i][j] : highestTile;
			}
		}

		this.ended = true;
		this.display.result(0, highestTile);
	}
};

function DOMDisplay() {
	this.tiles = document.querySelectorAll(".tile");
	this.resultBox = document.querySelector("#result-box");
	this.colors = {
		2: "#d3e9fe",
		4: "#bbddfd",
		8: "#a3d2fd",
		16: "#8bc6fc",
		32: "#72bafc",
		64: "#5aaffb",
		128: "#42a3fb",
		256: "#2b97fa",
		512: "#128cfa",
		1024: "#047ff0",
		2048: "#0473d8",
		4096: "#0366c0",
		8192: "#0359a8",
		16384: "#286D89",
		32768: "#135A79",
		65536: "#024c90",
		131072: "#023f78"
	};
}

DOMDisplay.prototype.addTile = function(tile, val) {
	var length = val.toString().length,
		span = document.createElement("SPAN");

	span.style.backgroundColor = this.colors[val];
	span.textContent = val;
	tile.appendChild(span);

	if (length === 4) {
		span.className = "small-text";
	} else if (length === 5 || length === 6) {
		span.className = "smallest-text";
	}
};

DOMDisplay.prototype.newTile = function(plan, x, y) {

	var tile = this.tiles[x * plan[0].length + y],
		span,
		val = plan[x][y],
		interval,
		dimension = 0,
		offset = 50;

	this.addTile(tile, val);
	span = tile.firstChild;

	span.style.height = "0%";
	span.style.width = "0%";
	span.style.top = "50%";
	span.style.left = "50%";
	span.textContent = "";

	interval = setInterval(function() {
		if (dimension === 100 && offset === 0) {
			clearInterval(interval);
			span.textContent = val;
			return;
		}

		dimension += 10;
		offset -= 5;
		span.style.height = dimension + "%";
		span.style.width = dimension + "%";
		span.style.top = offset + "%";
		span.style.left = offset + "%";
	}, 15);

};

DOMDisplay.prototype.mergeTile = function(tile, val) {
	var span,
		dimension = 100,
		offset = 0,
		way = 1,
		interval;

	this.removeTile(tile);

	this.addTile(tile, val);
	span = tile.firstChild;

	interval = setInterval(function() {
		if (dimension === 110) {
			way = -1;
		}

		dimension += way * 2;
		offset -= way * 1;

		span.style.height = dimension + "%";
		span.style.width = dimension + "%";
		span.style.top = offset + "%";
		span.style.left = offset + "%";

		if (dimension === 100) {
			clearInterval(interval);
			return;
		}

	}, 15);
};

DOMDisplay.prototype.removeTile = function(tile) {
	if (tile.firstChild !== null) {
		tile.removeChild(tile.firstChild);
	}
};

DOMDisplay.prototype.moveTile = function(plan, srcX, srcY, dstX, dstY) {

	var srcTile = this.tiles[srcX * plan[0].length + srcY],
		dstTile = this.tiles[dstX * plan[0].length + dstY];

	this.removeTile(srcTile);

	if (dstTile.firstChild !== null)
		this.mergeTile(dstTile, plan[dstX][dstY]);
	else
		this.addTile(dstTile, plan[dstX][dstY]);

};

DOMDisplay.prototype.clear = function() {
	for (var i = 0; i < this.tiles.length; i++) {
		this.removeTile(this.tiles[i]);
	}
	this.resultBox.style.display = "";
};

DOMDisplay.prototype.result = function(state, score) {
	var lostMessage = "GAME OVER",
		wonMessages = ["AWESOME", "WELL DONE", "NICE PLAY", "BRILLIANT", "GREAT", "NEAT", "RIGHT ON",
					"FANTASTIC", "SUPERB", "EXCELLENT", "BRAVO", "CONGRATS", "WAY TO GO", "TERRIFIC"],
		backgroundColor = ["grey", "#e3f1fe"],
		that = this,
		resultButton;

	resultButton = document.querySelector((state === 0) ? "#try-again-button" : "#keep-going-button");
	resultTile = document.querySelector("#result-tile");
	resultMessage = (state === 0) ? lostMessage : wonMessages[Math.floor(Math.random() * wonMessages.length)];

	setTimeout(function() {
		that.resultBox.style.display = "block";
		document.querySelector("#result-background").style.backgroundColor = backgroundColor[state];
		document.querySelector("#result-message").textContent = resultMessage;
		that.removeTile(resultTile);
		that.addTile(resultTile, score);
		resultButton.style.display = "block";

		resultButton.addEventListener("click", function() {
			that.resultBox.style.display = "";
		});
	}, 300);

};

window.onload = function() {

	var game = document.querySelector("#game");
	var resizeHandler = function() {
		var marginTop = (window.innerHeight - game.offsetHeight) / 2;
		if (marginTop > 0) {
			game.style.marginTop = marginTop + "px";
		}
	};

	resizeHandler();
	window.onresize = resizeHandler;

	var myGame = new Game(new DOMDisplay());
	myGame.start();

	var messageDisplay = document.querySelector("#message-box");
	var messageTimeout = setTimeout(function() {
		messageDisplay.textContent = "SWIPE OR USE ARROW KEYS TO PLAY";
	}, 4000);

	var restartButton = document.querySelector("#restart");
	restartButton.addEventListener("click", function() {
		myGame.start();
	});

	var keepGoingButton = document.querySelector("#keep-going-button");
	var tryAgainButton = document.querySelector("#try-again-button");
	keepGoingButton.addEventListener("click", function() {
		myGame.pause(1);
		keepGoingButton.style.display = "";
	});
	tryAgainButton.addEventListener("click", function() {
		myGame.start();
		tryAgainButton.style.display = "";
	});

	addEventListener("keydown", function(event) {
		if (keyCodes.hasOwnProperty(event.keyCode)) {
			if (messageTimeout) {
				clearTimeout(messageTimeout);
				messageDisplay.textContent = "";
			}

			myGame.move(keyCodes[event.keyCode]);
			event.preventDefault();
		}
	});

	var board = document.querySelector("#board"),
		startX = null,
		startY = null,
		direction = null;

	board.addEventListener("touchstart", function(event) {
		var toucheStart = event.touches;
		if (toucheStart.length > 1)
			return;

		startX = toucheStart[0].clientX;
		startY = toucheStart[0].clientY;
	}, false);

	board.addEventListener("touchmove", function(event) {
		event.preventDefault();
	}, false);

	board.addEventListener("touchend", function(event) {
		if (!startX || !startY)
			return;

		var touchEnd = event.changedTouches;
		if (touchEnd.length > 1)
			return;

		var endX = touchEnd[0].clientX,
			endY = touchEnd[0].clientY;

		var diffX = endX - startX,
			diffY = endY - startY;

		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 0)
				direction = "right";
			else if (diffX < 0)
				direction = "left";
		} else {
			if (diffY > 0)
				direction = "down";
			else if (diffY < 0)
				direction = "up";
		}

		if (direction) {
			if (messageTimeout) {
				clearTimeout(messageTimeout);
				messageDisplay.textContent = "";
			}

			myGame.move(direction);
		}

		startX = null;
		startY = null;
		direction = null;
	}, false);
};