import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;


public class Poker extends JFrame implements ActionListener {

	private List<Kort> kort = new LinkedList<Kort>();
	private List<Kort> spelare = new LinkedList<Kort>();
	private JPanel �vre = new JPanel(new GridLayout(1,5));
	private JLabel mitten = new JLabel("Du har inget..");
	private JPanel botten = new JPanel(new GridLayout(1,2));
	private JButton nytt = new JButton("Nytt spel");
	private JButton byt = new JButton("Byt kort");
	private int r�knare;

	public static void main(String[] arg){
		new Poker();
	}

	public Poker(){

		//Skapar kortlek
		skapaKortlek();

		//Blandar kortleken
		blandaKortlek();

		//Delar ut 5 kort
		for (int i = 0; i < 5; i++){
			delaKort();
		}

		//Sorterar kort
		sorteraKort();

		//R�knare ut pokerhand
		r�knaUt();

		//S�tter layout p� spelet
		setLayout(new GridLayout(3,1));
		setVisible(true);

		add(�vre);
		add(mitten);
		add(botten);

		addKort();

		mitten.setHorizontalAlignment(JLabel.CENTER);

		botten.add(nytt);
		botten.add(byt);

		nytt.addActionListener(this);
		byt.addActionListener(this);

		setDefaultCloseOperation(EXIT_ON_CLOSE);

		pack();

	}

	public void skapaKortlek(){
		for (Kort.F�rg f : Kort.F�rg.values()){
			for (Kort.V�rde c : Kort.V�rde.values()){
				kort.add(new Kort(f,c));
			}
		}
	}

	public void blandaKortlek(){
		Collections.shuffle(kort);
	}

	public void delaKort(){
		spelare.add(kort.get(0));
		kort.remove(0);
	}

	public void sorteraKort(){
		List<Kort> test = new LinkedList<Kort>();
		test = spelare.subList(0, spelare.size());

		jfrKort jfrkort = new jfrKort();
		Collections.sort(test, jfrkort);

		spelare = test.subList(0, test.size());	
	}

	public void bytKort(){

		for (int i = 0; i < spelare.size(); i++){
			if (spelare.get(i).geByta()){
				spelare.remove(i);
				delaKort();
				sorteraKort();
			}
		}

	}

	public void addKort(){
		for (int i = 0; i < spelare.size(); i++){
			�vre.add(spelare.get(i));
		}
	}

	public void r�knaUt(){
		
		if (royal()){}
		else if (fyrtal()){}
		else if (k�k()){}
		else if (f�rg()){}
		else if (stege()){}
		else if (triss()){}
		else if (tv�par()){}
		else if (par()){}
		else {
			mitten.setText("Du har inget..");	
		}
		
	}

	public boolean par(){
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geV�rde() == spelare.get(b).geV�rde()){
					mitten.setText("Du har par i " + spelare.get(a).geV�rde());
					return true;
				}
			}
		}
		return false;
	}

	public boolean tv�par(){
		int antal = 0;
		Kort.V�rde f = null;
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geV�rde() == spelare.get(b).geV�rde()){
					if (f == null){
						f = spelare.get(b).geV�rde();
					}
					antal++;
					if (antal == 2){
						mitten.setText("Du har tv�par i " + spelare.get(a).geV�rde() + " och " + f);	
						return true;
					}
				}
			}
		}
		return false;
	}

	public boolean triss(){
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				for (int c = b+1; c < spelare.size(); c++){
					if (spelare.get(a).geV�rde() == spelare.get(b).geV�rde() && spelare.get(b).geV�rde() == spelare.get(c).geV�rde()){
						mitten.setText("Du har triss i " + spelare.get(a).geV�rde());
						return true;
					}
				}
			}
		}
		return false;	
	}

	public boolean stege(){
		if (spelare.get(0).geV�rde().ordinal()+1 == spelare.get(1).geV�rde().ordinal() && spelare.get(1).geV�rde().ordinal()+1 == spelare.get(2).geV�rde().ordinal() && spelare.get(2).geV�rde().ordinal()+1 == spelare.get(3).geV�rde().ordinal() && spelare.get(3).geV�rde().ordinal()+1 == spelare.get(4).geV�rde().ordinal()){
			mitten.setText("Du har stege");
			return true;
		}
		else {
			return false;
		}
	}

	public boolean f�rg(){
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				for (int c = b+1; c < spelare.size(); c++){
					for (int d = c+1; d < spelare.size(); d++){
						for (int e = d+1; e < spelare.size(); e++){
							if (spelare.get(a).geF�rg() == spelare.get(b).geF�rg() && spelare.get(b).geF�rg() == spelare.get(c).geF�rg() && spelare.get(b).geF�rg() == spelare.get(d).geF�rg() && spelare.get(b).geF�rg() == spelare.get(e).geF�rg()){
								mitten.setText("Du har F�rg i " + spelare.get(a).geF�rg());
								return true;
							}
						}
					}
				}
			}
		}
		return false;	
	}

	public boolean k�k(){
		Kort.V�rde f = null;
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geV�rde() == spelare.get(b).geV�rde()){

					f = spelare.get(b).geV�rde();

					for (int c = 0; c < spelare.size(); c++){
						for (int d = c+1; d < spelare.size(); d++){
							for (int e = d+1; e < spelare.size(); e++){
								if (spelare.get(c).geV�rde() == spelare.get(d).geV�rde() && spelare.get(c).geV�rde() == spelare.get(e).geV�rde() && f != spelare.get(c).geV�rde()){
									mitten.setText("Du har k�k");
									return true;
								}
							}
						}
					}
				}
			}
		}
				return false;
		}

		public boolean fyrtal(){
			for (int a = 0; a < spelare.size(); a++){
				for (int b = a+1; b < spelare.size(); b++){
					for (int c = b+1; c < spelare.size(); c++){
						for (int d = c+1; d < spelare.size(); d++){
							if (spelare.get(a).geV�rde() == spelare.get(b).geV�rde() && spelare.get(b).geV�rde() == spelare.get(c).geV�rde() && spelare.get(b).geV�rde() == spelare.get(d).geV�rde() ){
								mitten.setText("Du har fyrtal i " + spelare.get(a).geV�rde());
								return true;
							}
						}
					}
				}
			}
			return false;	
		}


		public boolean royal(){
			if (f�rg()){
				if (spelare.get(0).geV�rde() == Kort.V�rde.Tio && spelare.get(1).geV�rde() == Kort.V�rde.Kn�ckt && spelare.get(2).geV�rde() == Kort.V�rde.Dam && spelare.get(3).geV�rde() == Kort.V�rde.Kung && spelare.get(4).geV�rde() == Kort.V�rde.Ess){
					mitten.setText("Du har royal straight flush");
					return true;
				}
				else{
					return false;
				}
			}
			else {
				return false;
			}
		}


		@Override
		public void actionPerformed(ActionEvent e) {

			if (e.getSource() == byt){
				r�knare++;
				if (r�knare == 100){
					byt.setEnabled(false);
				}
				for (int i = 0; i < 5; i++){
					bytKort();
				}
				�vre.removeAll();
				�vre.updateUI();
				addKort();
				r�knaUt();
			}

			if (e.getSource() == nytt){
				this.dispose();
				new Poker();
			}

		}


	}
