import java.awt.Color;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JButton;

public class Kort extends JButton implements ActionListener {

	public enum Färg {Hjärter, Klöver, Spader, Ruter};
	public enum Värde {Två, Tre, Fyra, Fem, Sex, Sju, Åtta, Nio, Tio, Knäckt, Dam, Kung, Ess};
	
	//Instansvariabler
	private Färg färg;
	private Värde värde;
	private boolean villByta;
	
	public Kort (Färg a, Värde b){
		färg = a;
		värde = b;
		this.setText(färg+" "+värde);
		addActionListener(this);
		setBackground(Color.GRAY);
		villByta=false;
		setOpaque(true);
	}
	
	public Färg geFärg(){
		return färg;
	}
	
	public Värde geVärde(){
		return värde;
	}
	
	public boolean geByta(){
		return villByta;
	}
	
	public String toString(){
		char ch = (char) (värde.ordinal()+65);
		return (ch+""+färg);
	}
	
	public void sättByta(){
		villByta = !villByta;
		
		if (villByta){
			setBackground(Color.yellow);
		}
		else {
			setBackground(Color.GRAY);
		}

	}

	@Override
	public void actionPerformed(ActionEvent e) {
		sättByta();	
	}
	
}
