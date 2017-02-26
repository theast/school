///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*  Types for generic A\* implementation.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    /** The path (sequence of Nodes) found by the search algorithm. */
    path : Node[];
    /** The total cost of the path. */
    cost : number;
}

/**
* A\* search implementation, parameterised by a `Node` type.
*  
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
    var dictHeuristics = new collections.Dictionary<Node, number>();
    // graph.compareNodes only checks if two nodes are the same, but we want to check the heuristics
    var comparer: collections.ICompareFunction<Node> = function(a, b) {
        if(!dictHeuristics.containsKey(a))
            dictHeuristics.setValue(a, heuristics(a));
        if(!dictHeuristics.containsKey(b))
            dictHeuristics.setValue(b, heuristics(b));
        var aCost = costs.getValue(a) + dictHeuristics.getValue(a), 
            bCost = costs.getValue(b) + dictHeuristics.getValue(b);
        return bCost - aCost;
    }
    var queue = new collections.PriorityQueue(comparer);
    var paths = new collections.Dictionary<Node, Node>();
    var costs = new collections.Dictionary<Node, number>();
    queue.enqueue(start);
    costs.setValue(start, 0);

    var node : Node;
    var startTime = Date.now();
    while(!queue.isEmpty()) {
        if(Date.now() - startTime >= timeout*1000)
            throw("aStarSearch timed out");
        node = queue.dequeue();
        if(goal(node))
            break;

        var nodeCost = costs.getValue(node);
        // check all the edges from this node and update their costs
        for(var edge of graph.outgoingEdges(node)) {
            var newNode : Node = edge.to;
            var newCost = nodeCost + edge.cost;
            if(!costs.containsKey(newNode) || newCost < costs.getValue(newNode)) {
                // the node has never been visited, or we have found a shorter path to it
                paths.setValue(newNode, node);
                costs.setValue(newNode, newCost);
                // costs must be updated before we enqueue because the comparer needs the new cost
                queue.enqueue(newNode);
            }
        }
    }
    if(!goal(node))
        return undefined; // no path

    var result : SearchResult<Node> = {
        path: [],
        cost: costs.getValue(node)
    };
    // node is equal to goal, traverse the links backwards to reconstruct the entire path  
    for(; node != start; node = paths.getValue(node))
        result.path.unshift(node);
    return result;
}


