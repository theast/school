import java.util.*;


public class prioQueue {

	private Comparator<Bid> myComp; 
	public int        	  currentSize;
	private List<Bid>         array;


	public void insert(Bid x){

		array.add(currentSize, x);
		currentSize++;
		percolateUp((currentSize-1));

	}
	
	public void percolateUp (int pos){


		for (; pos > 1 && myComp.compare(array.get(pos), array.get(pos/2)) < 0; pos/=2){

			Bid temp = array.get(pos);
			array.set(pos, array.get(pos/2));
			array.set(pos/2, temp);

		}
		
		
		
	}
	
	public void changePrice (Bid a, int pos, int nyttpris){
				
		Bid b = new Bid(a.namn, a.ks, nyttpris);
			
		array.set(pos, b);
				
		percolateUp(pos);
		percolateDown(pos);
		
		
	}

	public Bid deleteMin( ){
		Bid minItem = findMin();
		
		if (currentSize > 2){
			array.set(1, array.get(currentSize-1));
			array.remove(currentSize-1);
			currentSize--;
			percolateDown(1);
		
		}
		else {
			array.remove(1);
			currentSize--;
		}
		return minItem;
	}

	public Bid findMin(){
		if(arTom()){
			return null;
		}

		return array.get(1);
	}

	private void percolateDown (int pos){

		int child;
		Bid tmp = array.get(pos); 
		
		for (; pos*2 <= currentSize-1; pos = child){
			child = pos*2;

			if(child != currentSize-1 && myComp.compare(array.get(child+1), array.get(child)) < 0)
				child++;
			if (myComp.compare(array.get(child), tmp) < 0)
				array.set(pos, array.get(child));
			else
				break;

		}

		array.set(pos, tmp);
		}
		
	

	public prioQueue(Comparator<Bid> c){
		currentSize = 1;
		array = new ArrayList<Bid>();
		myComp = c;
		array.add(null);
	}

	public int storlek(){
		return array.size();
	}

	public boolean arTom(){
		return currentSize == 1;
	}

	public List<Bid> geLista(){
		return array;
	}


	public static class DefaultComparator implements Comparator<Bid> {
		public int compare(Bid o1, Bid o2) {

			return (o1.pris - o2.pris);
		}
	}

	public static class reverseDefaultComparator implements Comparator<Bid> {
		public int compare(Bid o1, Bid o2) {


			return -(o1.pris - o2.pris);

		}
	}	


}
