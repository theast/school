public class MySortedIntArray implements MyIntSet {

	private int[] arraySet;
	private int antalElement;

	MySortedIntArray(){
		antalElement = 0;
		arraySet = new int[10];
	}

	public void addElement(int element){
		antalElement++;
		if (arraySet.length <= antalElement){
			int[] temp = arraySet;
			arraySet = new int[arraySet.length*2];
			for (int i = 0; i < temp.length; i++){
				arraySet[i] = temp[i];
			}
		}
		else {
			arraySet[antalElement-1] = element;
		}
	}

	public boolean member(int element) {
		return binarySearch(element, 0, antalElement);
	}

	public boolean binarySearch(int el, int first, int last){

		if(first>last){
			return false;
		}
		else {
			int middle = (first+last)/2;

			if (arraySet[middle] == el){
				return true;
			}

			else if (el < arraySet[middle]) {
				return (binarySearch(el, first, middle-1));
			}

			else  {
				return (binarySearch(el, middle+1, last));
			}

		}

	}


}