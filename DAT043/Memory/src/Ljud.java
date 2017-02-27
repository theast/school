import java.awt.*;
import java.applet.*;
import java.net.*;

public class Ljud extends Frame {

	//Instansvariabler.
	private URL a;
	private URL b;
	private AudioClip c;
	private AudioClip d;

	//Konstruktor.
	public Ljud(int r){

		//Skapar URL..
		try {
			a = new URL("file:///Users/theodor/Desktop/Dropbox/Chalmers/Java/Memory/bra.au");
			b = new URL("file:///Users/theodor/Desktop/Dropbox/Chalmers/Java/Memory/daligt.au");
		}
		catch (MalformedURLException e){
			System.out.println("Felaktig URL..");
		}

		c = Applet.newAudioClip(a);
		d = Applet.newAudioClip(b);

		//Spelar upp ljud beroende på inmatning till konstruktorn.
		if (r==1){
			c.play();
		}
		else {
			d.play();
		}
	}

	//Klassmetoden med inmatning..
	public static void spelaLjud(int h){
		new Ljud(h); //Skapar nytt ljud
	}


}
