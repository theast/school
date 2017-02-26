///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>
/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/
/** An edge in a graph. */
var Edge = (function () {
    function Edge() {
    }
    return Edge;
}());
/** Type that reports the result of a search. */
var SearchResult = (function () {
    function SearchResult() {
    }
    return SearchResult;
}());
/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var result = {
        path: [start],
        cost: 0
    };
    var queue = new collections.PriorityQueue(graph.compareNodes);
    queue.add(start);
    paths = collections.Dictionary();
    costs = collections.Dictionary();
    while (!queue.isEmpty()) {
        var currentNode = queue.dequeue();
        if (goal(currentNode))
            break;
        for (var _i = 0, _a = graph.outgoingEdges(start); _i < _a.length; _i++) {
            var nextEdge = _a[_i];
            var nextNode = nextEdge.to;
            var newCost = result.cost + nextEdge.cost;
            if () {
            }
        }
    }
    return result;
}
