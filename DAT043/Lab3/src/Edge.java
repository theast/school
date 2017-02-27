
public class Edge {
	
    private GraphNode node;
    private Integer cost;

    public Edge(GraphNode nodeTo, Integer cost) {
            this.node = nodeTo;
            this.cost = cost;
    }
   
    public GraphNode getNode() {
            return node;
    }
   
    public Integer getCost() {
            return cost;
    }
}
