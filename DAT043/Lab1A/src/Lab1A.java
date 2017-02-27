import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class Lab1A {

	public static void main(String[] args) throws FileNotFoundException {

		if(args.length != 2) 
		{
			System.out.println("Inte korrekt antal argument!");
		}
		else {
			int element = Integer.parseInt(args[0]);

			MySortedIntArray lista = new MySortedIntArray();
			File fileName = new File(args[1]);
			Scanner inFil = new Scanner(fileName);
			while(inFil.hasNextInt()){
				lista.addElement(inFil.nextInt());
			}
			inFil.close();
			System.out.println(lista.member(element));

		}
	}
}
