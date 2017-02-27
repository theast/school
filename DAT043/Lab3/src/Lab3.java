import java.util.*;
import Lab3Help.*;

public class Lab3 {

	public static void main(String args[]){
		Lab3File lab3file = new Lab3File();
		List<BStop> stops = lab3file.readStops(args[0]);
		List<BLineTable> lines = lab3file.readLines(args[1]);

		MyPath p = new MyPath(stops, lines);
		p.computePath(args[2], args[3]);
		System.out.println(p.getPathLength());
		
		for (Iterator<String> it = p.getPath(); it.hasNext(); ) {
		    String s = (String)it.next(); 
		    System.out.println(s);
		}
	}
}	