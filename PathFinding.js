var astar = {
    root2: Math.sqrt(2), // This is used for distance calculations. Since we don't want to calculate it every single time we will just store the value.
    timeTaken: 0,

    init: function (map) {
        for (var i = 0; i < map.length; i++) {
            for (var j = 0; j < map[i].length; j++) {
                var cell = map[i][j];
                cell.f = 0;
                cell.g = 0;
                cell.h = 0;
                cell.visited = false;
                cell.closed = false;
                cell.parent = null;
            }
        }
    },

    search: function (map, start, end) {
        var startTime = new Date();

        // Initialize our path map
        this.init(map);

        // Create an open and a closed list.
        var openList = new BinaryHeap(function(cell) {return cell.f;});
        //var closedList = new BinaryHeap(function(cell) {return cell.f;});

        // Add the start cell to our open list.
        openList.push(start);

        while(openList.size() > 0) {
            // Get the first cell from the open list with the lowest f score
            // and push it onto the closed list.
            var currentCell = openList.pop();
            currentCell.closed = true;

            // Have we reached the end?
            if (currentCell == end) {
                this.timeTaken = (new Date()).getTime() - startTime.getTime();
                return this.createPathFromEnd(currentCell);
            }

            // Get neighbor cells.
            var cellNeighbors = this.neighbors(map, currentCell);

            // Remove closed neighbors we don't need to re-check them.
            //this.removeClosedNeighbors(cellNeighbors, closedList);

            // Loop through all neighboring cells and recalculate
            // the h, g, and f scores.
            for (var i in cellNeighbors) {
                var neighbor = cellNeighbors[i];

                // Make sure the cell isn't a tower or a wall.
                if (!neighbor.isWalkable() || neighbor.closed) {
                    continue;
                }

                // Update the cell's values
                this.updateScores(currentCell, neighbor, end, openList);
            }
        }

        this.timeTaken = (new Date()).getTime() - startTime.getTime();
        
        // Return an empty list when no path is found!
        return [];
    },

    createPathFromEnd: function (currentCell) {
       var curr = currentCell;
        var ret = [];
        while (curr.parent) {
            ret.push(curr);
            curr = curr.parent;
        }
        return ret.reverse();
    },

    updateScores: function (parentCell, cellToUpdate, endCell, openList) {
         // We might want to add more to g if the cell is a tower...
        var gScore = parentCell.g + 2;
        var visited = cellToUpdate.visited;

        // Punish Diagonals!
        if (parentCell.x != cellToUpdate.x && parentCell.y != cellToUpdate.y) {
            gScore = parentCell.g + 2.5;
        }

        if (!visited || gScore < cellToUpdate.g) {
            cellToUpdate.visited = true;
            cellToUpdate.parent = parentCell;
            cellToUpdate.h = this.distance(cellToUpdate, endCell);
            cellToUpdate.g = gScore;
            cellToUpdate.f = cellToUpdate.h + cellToUpdate.g;
        }

        if (!visited) {
            openList.push(cellToUpdate);
        } else {
            openList.resortElement(cellToUpdate);
        }
    },

    distance: function (start, end) {
        // Here we will be using a mix between the manhattan distance and eulicidean distance for the heuristic.
        // First we calculate the number of diagonal steps needed.
        //var num_diagonal_steps = Math.min(Math.abs(start.x - end.x), Math.abs(start.y - end.y)) * 20;

        // Now we get the number of straight steps needed.
        var num_straight_steps = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);

        // Finally we return the 2 values put together and use this as our h value.
        return num_straight_steps; //+ this.root2 * num_diagonal_steps;
    },

    neighbors: function (map, cell) {
        var result = [];
        var x = cell.x;
        var y = cell.y;

        var topMidCell = null;
        var leftMidCell = null;
        var rightMidCell = null;
        var bottomMidCell = null;

        // Get all 8 possible locations to move to.

        // Top Middle
        if (map[x] && map[x][y+1]) {
            topMidCell = map[x][y+1];
            result.push(map[x][y+1]);
        }

        // Bottom Middle
        if (map[x] && map[x][y-1]) {
            bottomMidCell = map[x][y-1];
            result.push(map[x][y-1]);
        }

        // Middle Left
        if (map[x-1] && map[x-1][y]) {
            leftMidCell = map[x-1][y];
            result.push(map[x-1][y]);
        }

        // Middle Right
        if (map[x+1] && map[x+1][y]) {
            rightMidCell = map[x+1][y];
            result.push(map[x+1][y]);
        }
        
        if (topMidCell && topMidCell.isWalkable()) {
            if (leftMidCell && leftMidCell.isWalkable()) {
                // Top Left
                if (map[x-1] && map[x-1][y-1])
                    result.push(map[x-1][y-1]);
            }
            if (rightMidCell && rightMidCell.isWalkable()) {
                // Top Right
                if (map[x+1] && map[x+1][y+1])
                    result.push(map[x+1][y+1]);
            }
        }

        if (bottomMidCell && bottomMidCell.isWalkable()) {
            if (leftMidCell && leftMidCell.isWalkable()) {
                // Bottom Left
                if (map[x-1] && map[x-1][y+1])
                    result.push(map[x-1][y+1]);
            }
            if (rightMidCell && rightMidCell.isWalkable()) {
                // Bottom Right
                if (map[x+1] && map[x+1][y-1])
                    result.push(map[x+1][y-1]);
            }
        }

        return result;
    }
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(element) {
        // Get the length of the array.
        var len = this.length;

        // Find the index of the element.
        for (var from = 0; from < len; from++) {
            if (this[from] == element) {
                return from;
            }
        }
        return -1;
    };
}

function BinaryHeap (scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function (element) {
        // Add element to the end of the heap.
        this.content.push(element);
        // Bubble it up to it's correct position in the heap.
        this.bubbleUp(this.content.length - 1);
    },

    pop: function () {
        // Get the first value in the heap.
        var result = this.content[0];
        // Get the last value in the heap.
        var end = this.content.pop();

        // If there are more values in the heap place the last value up front
        // and let it sink to the bottom.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        
        return result;
    },

    remove: function (element) {
        var i = this.content.indexOf(element);

        var end = this.content.pop();
        if (i != this.content.length - 1) {
            this.content[i] = end;
            if (this.scoreFunction(end) < this.scoreFunction(element)) {
                this.bubbleUp(i);
            } else {
                this.sinkDown(i);
            }
        }
    },

    size: function() {
        return this.content.length;
    },

    resortElement: function (element) {
        this.bubbleUp(this.content.indexOf(element));
    },

    bubbleUp: function (n) {
        var element = this.content[n];

        while (n > 0) {
            var parentN = Math.floor((n + 1) / 2) - 1;
            var parent = this.content[parentN];
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            } else {
                break;
            }
        }
    },

    sinkDown: function (n) {
        var length = this.content.length;
        var element = this.content[n];
        var elemScore = this.scoreFunction(element);

        while (true) {
            var child2N = (n + 1) * 2;
            var child1N = child2N - 1;
            var swap = null;

            // Check the score of the first child if it exists.
            if (child1N < length) {
                // Get the child and calculate the score.
                var child1 = this.content[child1N];
                var child1Score = this.scoreFunction(child1);

                // Check to see if we need to swap the elements.
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }

            // Check the score of the second child if it exists.
            if (child2N < length) {
                var child2 = this.content[child2N];
                var child2Score = this.scoreFunction(child2);
                var compareScore = elemScore;

                // If we already swapped values use the child1Score
                if (swap) {
                    compareScore = child1Score;
                }

                // Check to see if we need to swap the elements.
                if (child2Score < compareScore) {
                    swap = child2N
                }
            }

            // Swap the current element with a child element and store swapped
            // index as our new index into the heap array.
            if (swap != null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                // We are done since there is nothing more to swap.
                break;
            }
        }
    }
}

