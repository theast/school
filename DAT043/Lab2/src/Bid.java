public class Bid { 
	
	public String namn;
	public int pris;
	public int nyttPris;
	public String ks;
	
	Bid(String namn, String ks, int pris){
		this.namn = namn;
		this.ks = ks;
		this.pris = pris;
	}

	Bid(String namn, String ks, int pris, int nyttPris){
		this.namn = namn;
		this.ks = ks;
		this.pris = pris;
		this.nyttPris = nyttPris;
	}
	
	public int pris(){
		return pris;
	}

	public String namn(){
		return namn;
	}
	}
