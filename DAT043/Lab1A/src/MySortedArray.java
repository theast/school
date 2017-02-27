import java.util.*;

public class MySortedArray<E extends Comparable<? super E>> implements MySet<E> {

	private int antalElement;
	private Object[] arraySet;
	private Comparator<E> comp;

	public MySortedArray(){
		antalElement = 0;
		arraySet = new Object[10];
		comp = new skapaComparator<E>();
	}

	public void addElement(E element){
		antalElement++;

		if (arraySet.length <= antalElement){
			Object[] temp = arraySet;
			arraySet = new Object[arraySet.length*2];
			for (int i = 0; i < temp.length; i++){
				arraySet[i] = temp[i];
			}
		}
		else {
			arraySet[antalElement-1] = element;
		}
	}

	public boolean member(E element) {
		return binarySearch(element, 0, antalElement);
	}

	public boolean binarySearch(E el, int first, int last){

		if(first>last){
			return false;
		}
		else {
			int middle = (first+last)/2;
			if (comp.compare((E) arraySet[middle], el) == 0){
				return true;
			}

			else if (comp.compare((E) arraySet[middle], el) != 0) {
				return (binarySearch(el, first, middle-1));
			}

			else  {
				return (binarySearch(el, middle+1, last));
			}

		}

	}

	private class skapaComparator<E> implements Comparator<E> {

		public int compare(E el1, E el2){
			String el1String = el1.toString();
			String el2String = el2.toString();

			return el1String.compareTo(el2String);
		}

	}


}
