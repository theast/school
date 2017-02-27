import Lab3Help.*;

import java.util.*;

public class Graph {

	List<GraphNode> allNodes = new ArrayList<GraphNode>();
	BusMapFrame map = new BusMapFrame();
	public GraphNode startNode;
	public GraphNode stopNode;
	GraphNode previous;

	public Graph(String startNode, String stopNode, List<BStop> stops, List<BLineTable> lines){
		buildGraph(stops);
		addEdge(lines);
		this.startNode = findNode(startNode);
		this.stopNode = findNode(stopNode);
	}

	public void buildGraph(List<BStop> stops){
		map.initMap();
		for (BStop stop : stops){
			allNodes.add(new GraphNode(stop));
			map.drawStop(stop.getX(), stop.getY(), stop.getName());
		}	
	}

	public void addEdge (List<BLineTable> lines){
		for (BLineTable bLine : lines) {
			map.nextColor();
			for (BLineStop stop : bLine.getStops()) {
				GraphNode el = findNode(stop.getName());
				if (!(stop.getTime() == 0)){
					if (previous.checkEdges(el)){
						Edge a = previous.findEdge(el);
						if (stop.getTime() < a.getCost()){
							previous.edges.add(new Edge(el, stop.getTime()));
							map.drawEdge(previous.node.getX(), previous.node.getY(), el.node.getX(), el.node.getY());
						}	
					}
					else {
						previous.edges.add(new Edge(el, stop.getTime()));
						map.drawEdge(previous.node.getX(), previous.node.getY(), el.node.getX(), el.node.getY());
					}
				}	
				previous = el;	
			}
		}
	}


	public GraphNode findNode(String name){
		for (GraphNode el : allNodes){
			if (el.node.getName().compareTo(name) == 0){
				return el;
			}
		}
		return null;
	}


}
