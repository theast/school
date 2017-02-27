import java.text.Collator;
import java.util.Comparator;


public class jfrKort implements Comparator<Kort>{
	private Collator col = Collator.getInstance();
	
	
	@Override
	public int compare(Kort a, Kort b) {
	
		String kort1 = a.toString();
		String kort2 = b.toString();
		
		col.setStrength(Collator.PRIMARY);
		
		return col.compare(kort1, kort2);
			
	}

}
