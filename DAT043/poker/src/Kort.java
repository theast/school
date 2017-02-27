import java.awt.Color;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JButton;

public class Kort extends JButton implements ActionListener {

	public enum F�rg {Hj�rter, Kl�ver, Spader, Ruter};
	public enum V�rde {Tv�, Tre, Fyra, Fem, Sex, Sju, �tta, Nio, Tio, Kn�ckt, Dam, Kung, Ess};
	
	//Instansvariabler
	private F�rg f�rg;
	private V�rde v�rde;
	private boolean villByta;
	
	public Kort (F�rg a, V�rde b){
		f�rg = a;
		v�rde = b;
		this.setText(f�rg+" "+v�rde);
		addActionListener(this);
		setBackground(Color.GRAY);
		villByta=false;
		setOpaque(true);
	}
	
	public F�rg geF�rg(){
		return f�rg;
	}
	
	public V�rde geV�rde(){
		return v�rde;
	}
	
	public boolean geByta(){
		return villByta;
	}
	
	public String toString(){
		char ch = (char) (v�rde.ordinal()+65);
		return (ch+""+f�rg);
	}
	
	public void s�ttByta(){
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
		s�ttByta();	
	}
	
}
