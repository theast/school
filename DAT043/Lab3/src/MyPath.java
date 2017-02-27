import java.util.*;

import Lab3Help.*;

public class MyPath implements Path {
	
	List<BLineTable> bTabell = new ArrayList<BLineTable>();
	List<BStop> bStop = new ArrayList<BStop>();
	List<String> Path = new ArrayList<String>();
	Graph a;
	Dijkstra d;
	
	public MyPath(List<BStop> stops, List<BLineTable> lines){
	bStop = stops;
	bTabell = lines;
	}
	
	public void computePath(String from, String to) {
		a = new Graph(from, to, bStop, bTabell);
		d = new Dijkstra(a);
		d.dijkstra();
		
	}

	public Iterator<String> getPath() {
		GraphNode stopNode = d.g.stopNode;
		GraphNode startNode = d.g.startNode;
		
		while (!(stopNode.node.getName().compareTo(startNode.node.getName()) == 0)){
			Path.add(stopNode.node.getName());
			stopNode = stopNode.previous;
		}
		
		Path.add(startNode.node.getName());
		Collections.reverse(Path);
		
		Iterator<String> it = Path.iterator();
		
		return it;
	}
	
	public int getPathLength() {
		return d.g.stopNode.distance;
	}
	
}
