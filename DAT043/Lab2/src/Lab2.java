import java.io.*;
import java.util.*;
import java.util.regex.*;

/**
 * ...
 * @param <E>
 */

public class Lab2 {
	private static prioQueue salj, kop;

	public static void trade(List<Bid> bids) {

		// Skapar tv� prioritetsk�er, en f�r s�lj och en f�r k�p.
		salj = new prioQueue(new prioQueue.DefaultComparator());
		kop = new prioQueue(new prioQueue.reverseDefaultComparator());


		for (int i = 0; i < bids.size(); i++){

			if (bids.get(i).ks.compareTo("K") == 0){
				kop.insert(bids.get(i));

			}

			else if (bids.get(i).ks.compareTo("S") == 0){
				salj.insert(bids.get(i));

			}

			else if (bids.get(i).ks.compareTo("NS") == 0){

				for (int a = 1; a < salj.currentSize; a++){

					if (bids.get(i).namn.compareTo(salj.geLista().get(a).namn) == 0){

						salj.changePrice(salj.geLista().get(a), a, bids.get(i).nyttPris);

					}
				}


			}

			else if (bids.get(i).ks.compareTo("NK") == 0){
				for (int a = 1; a < kop.storlek(); a++){
					if (bids.get(i).namn.compareTo(kop.geLista().get(a).namn) == 0){

						kop.changePrice(kop.geLista().get(a), a, bids.get(i).nyttPris);


					}
				}

			}
			checkKop(salj, kop);
		}



		checkKop(salj, kop);
		orderBok(salj, kop);



	}   

	public static void checkKop(prioQueue salj, prioQueue kop){
		while (!salj.arTom() && !kop.arTom() && (kop.findMin().pris >= salj.findMin().pris)){
			System.out.println(kop.findMin().namn + " köper från " + salj.findMin().namn + " för " + salj.findMin().pris + " kr");

			salj.deleteMin();
			kop.deleteMin();


		}
	}

	public static void orderBok(prioQueue salj, prioQueue kop){
		// Skriver ut orderboken..
		System.out.println("");
		System.out.println("Orderbok:");

		System.out.print("Säljare: ");
		while (!salj.arTom()){
			Bid min = salj.deleteMin();
			System.out.print((min.namn + " " + min.pris + ", "));
		}

		System.out.println("");
		System.out.print("Köpare: ");
		while (!kop.arTom()){
			Bid min = kop.deleteMin();
			System.out.print((min.namn + " " + min.pris + ", "));
		}
	}


	/**
	 * Parses a bid.
	 *
	 * @param s The string that should be parsed.
	 *
	 * @throws MalformedBid If the bid cannot be parsed.
	 */

	public static Bid parseBid(String s) throws MalformedBid {
		Matcher m = Pattern.compile(
				"\\s*(\\S+)\\s+" +
						"(?:(K|S)\\s+(\\d+)|(NS|NK)\\s+(\\d+)\\s+(\\d+))" +
				"\\s*").matcher(s);

		if (m.matches()) {
			if (m.group(2) == null) {
				// m.group(1): The name of the buyer/seller.
				// m.group(4): NK or NS.
				// m.group(5): Old value.
				// m.group(6): New value.
				return new Bid(m.group(1), m.group(4), Integer.parseInt(m.group(5)), Integer.parseInt(m.group(6)));  // Incomplete code.
			} else {
				// m.group(1): The name of the buyer/seller.
				// m.group(2): K or S.
				// m.group(3): The value.
				return new Bid(m.group(1), m.group(2), Integer.parseInt(m.group(3)));  // Incomplete code.
			}
		} else {
			throw new MalformedBid(s);
		}
	}

	/**
	 * Parses line-separated bids from the given Readable thing.
	 *
	 * @param input The character stream that should be parsed.
	 *
	 * @throws MalformedBid If some bid couldn't be parsed.
	 */

	public static List<Bid> parseBids(Readable input) throws MalformedBid {
		ArrayList<Bid> bids = new ArrayList<Bid>();
		Scanner s = new Scanner(input);

		while (s.hasNextLine()) {
			bids.add(parseBid(s.nextLine()));
		}
		s.close();

		return bids;
	}

	/**
	 * Exception class for malformed bids.
	 */

	public static class MalformedBid extends Exception {
		MalformedBid(String bid) {
			super("Malformed bid: " + bid + ".");
		}
	}

	/**
	 * Prints usage info.
	 */

	public static void usageInfo() {
		System.err.println("Usage: java Aktiehandel [<file>]");
		System.err.println("If no file is given, then input is " +
				"read from standard input.");
	}

	/**
	 * ...
	 */

	public static void main(String[] args) {
		if (args.length >= 2) {
			usageInfo();
		} else {
			try {
				BufferedReader r;
				if (args.length == 0) {
					// Read from stdin.
					r = new BufferedReader(new InputStreamReader(System.in));
				} else {
					// Read from a named file.
					r = new BufferedReader(new FileReader(args[0]));
				}

				try {
					List<Bid> bids = parseBids(r);
					trade(bids);
				} finally {
					r.close();
				}
			} catch (MalformedBid e) {
				System.err.println(e.getMessage());
				usageInfo();
			} catch (FileNotFoundException e) {
				System.err.println("File not found: " + args[0] + ".");
				usageInfo();
			} catch (IOException e) {
				System.err.println(e.getMessage());
				usageInfo();
			}
		}
	}
}
