import java.util.*;


public class Dijkstra {

	Graph g;
	PriorityQueue<GraphNode> queue = new PriorityQueue<GraphNode>();

	public Dijkstra(Graph g){
		this.g = g;
		g.startNode.setDistance(0);
		fillQueue();
	}

	public void fillQueue(){
		for (GraphNode a : g.allNodes){
			queue.add(a);
		}
	}

	public void dijkstra(){
		while (!queue.isEmpty()){
			GraphNode a = queue.poll();
			
			for (Edge e : a.edges){
				GraphNode node = e.getNode();
				int weight = e.getCost();
				int cost = a.distance + weight;
				
				if (cost < node.distance){
					queue.remove(node);
					node.previous = a;
					node.setDistance(cost);
					queue.add(node);
				}

			}
		}
	}
}
