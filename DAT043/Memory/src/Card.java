import javax.swing.*;
import java.awt.*;

public class Card extends JButton {
	public enum Status {HIDDEN, VISIBLE, MISSING};

	//Instansvariabler.
	private Icon icon;
	private Status card = Status.HIDDEN;

	//Skapar konstruktor.
	public Card(Icon r){
		this (r, Status.HIDDEN);
	}

	//Skapar konstruktor och sparar till variabler samt �ndrar status.
	public Card(Icon r, Status a){
		icon = r;
		card = a;
		setStatus(a);
	}

	//G�r det m�jligt att �ndra p� ett kort..
	public void setStatus(Status a){
		card = a;

		//Om ett kort har status hidden byter vi f�rg till bl�.
		if (this.getStatus() == Card.Status.HIDDEN){
			this.setIcon(null);
			this.setOpaque(true);
			this.setBackground(Color.blue);
		} 

		//Om ett kort har status missing �ndrar vi f�rg till vit.
		else if (this.getStatus() == Card.Status.MISSING){
			this.setIcon(null);
			this.setOpaque(true);
			this.setBackground(Color.white);
		}

		//Annars s�tter vi en icon.
		else {
			this.setIcon(icon);
		}
	}

	//Returnerar ett korts status.
	public Status getStatus(){
		return card;
	}

	//Kopierar ett kort.
	public Card copy(){
		Card c = new Card(icon, card);
		return c;
	}

	//Kollar om ett kort har samma icon.
	public boolean equalIcon(Card a){
		return (a.icon==icon);
	}


}
