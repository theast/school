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
	private JPanel övre = new JPanel(new GridLayout(1,5));
	private JLabel mitten = new JLabel("Du har inget..");
	private JPanel botten = new JPanel(new GridLayout(1,2));
	private JButton nytt = new JButton("Nytt spel");
	private JButton byt = new JButton("Byt kort");
	private int räknare;

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

		//Räknare ut pokerhand
		räknaUt();

		//Sätter layout på spelet
		setLayout(new GridLayout(3,1));
		setVisible(true);

		add(övre);
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
		for (Kort.Färg f : Kort.Färg.values()){
			for (Kort.Värde c : Kort.Värde.values()){
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
			övre.add(spelare.get(i));
		}
	}

	public void räknaUt(){
		
		if (royal()){}
		else if (fyrtal()){}
		else if (kåk()){}
		else if (färg()){}
		else if (stege()){}
		else if (triss()){}
		else if (tvåpar()){}
		else if (par()){}
		else {
			mitten.setText("Du har inget..");	
		}
		
	}

	public boolean par(){
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geVärde() == spelare.get(b).geVärde()){
					mitten.setText("Du har par i " + spelare.get(a).geVärde());
					return true;
				}
			}
		}
		return false;
	}

	public boolean tvåpar(){
		int antal = 0;
		Kort.Värde f = null;
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geVärde() == spelare.get(b).geVärde()){
					if (f == null){
						f = spelare.get(b).geVärde();
					}
					antal++;
					if (antal == 2){
						mitten.setText("Du har tvåpar i " + spelare.get(a).geVärde() + " och " + f);	
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
					if (spelare.get(a).geVärde() == spelare.get(b).geVärde() && spelare.get(b).geVärde() == spelare.get(c).geVärde()){
						mitten.setText("Du har triss i " + spelare.get(a).geVärde());
						return true;
					}
				}
			}
		}
		return false;	
	}

	public boolean stege(){
		if (spelare.get(0).geVärde().ordinal()+1 == spelare.get(1).geVärde().ordinal() && spelare.get(1).geVärde().ordinal()+1 == spelare.get(2).geVärde().ordinal() && spelare.get(2).geVärde().ordinal()+1 == spelare.get(3).geVärde().ordinal() && spelare.get(3).geVärde().ordinal()+1 == spelare.get(4).geVärde().ordinal()){
			mitten.setText("Du har stege");
			return true;
		}
		else {
			return false;
		}
	}

	public boolean färg(){
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				for (int c = b+1; c < spelare.size(); c++){
					for (int d = c+1; d < spelare.size(); d++){
						for (int e = d+1; e < spelare.size(); e++){
							if (spelare.get(a).geFärg() == spelare.get(b).geFärg() && spelare.get(b).geFärg() == spelare.get(c).geFärg() && spelare.get(b).geFärg() == spelare.get(d).geFärg() && spelare.get(b).geFärg() == spelare.get(e).geFärg()){
								mitten.setText("Du har Färg i " + spelare.get(a).geFärg());
								return true;
							}
						}
					}
				}
			}
		}
		return false;	
	}

	public boolean kåk(){
		Kort.Värde f = null;
		for (int a = 0; a < spelare.size(); a++){
			for (int b = a+1; b < spelare.size(); b++){
				if (spelare.get(a).geVärde() == spelare.get(b).geVärde()){

					f = spelare.get(b).geVärde();

					for (int c = 0; c < spelare.size(); c++){
						for (int d = c+1; d < spelare.size(); d++){
							for (int e = d+1; e < spelare.size(); e++){
								if (spelare.get(c).geVärde() == spelare.get(d).geVärde() && spelare.get(c).geVärde() == spelare.get(e).geVärde() && f != spelare.get(c).geVärde()){
									mitten.setText("Du har kåk");
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
							if (spelare.get(a).geVärde() == spelare.get(b).geVärde() && spelare.get(b).geVärde() == spelare.get(c).geVärde() && spelare.get(b).geVärde() == spelare.get(d).geVärde() ){
								mitten.setText("Du har fyrtal i " + spelare.get(a).geVärde());
								return true;
							}
						}
					}
				}
			}
			return false;	
		}


		public boolean royal(){
			if (färg()){
				if (spelare.get(0).geVärde() == Kort.Värde.Tio && spelare.get(1).geVärde() == Kort.Värde.Knäckt && spelare.get(2).geVärde() == Kort.Värde.Dam && spelare.get(3).geVärde() == Kort.Värde.Kung && spelare.get(4).geVärde() == Kort.Värde.Ess){
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
				räknare++;
				if (räknare == 100){
					byt.setEnabled(false);
				}
				for (int i = 0; i < 5; i++){
					bytKort();
				}
				övre.removeAll();
				övre.updateUI();
				addKort();
				räknaUt();
			}

			if (e.getSource() == nytt){
				this.dispose();
				new Poker();
			}

		}


	}
