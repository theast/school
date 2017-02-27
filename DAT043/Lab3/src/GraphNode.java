import Lab3Help.*;
import java.util.*;

public class GraphNode implements Comparable<GraphNode> {
	
	BStop node;
	List<Edge> edges;
	int distance;
	GraphNode previous;

	
	public GraphNode (BStop node){
		this.node = node;
		edges = new ArrayList<Edge>();
		distance = Integer.MAX_VALUE;
	}

	public boolean checkEdges(GraphNode el){
		for (Edge a : edges){
			if (a.getNode().node.getName().compareTo(el.node.getName()) == 0){
				return true;
			}
		}
		return false;
	}
	
	public Edge findEdge(GraphNode el){
		
		for (Edge a : edges){
			if (a.getNode().node.getName().compareTo(el.node.getName()) == 0){
				return a;
			}
		}
		return null;
	}
	
	public void setDistance(int d){
		distance = d;
	}
	
	public List<Edge> getEdges(){
		return edges;
	}

	public int compareTo(GraphNode el) {
	return distance-el.distance;
	}
	
}
