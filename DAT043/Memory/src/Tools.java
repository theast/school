public class Tools {

	//Skapar klassmetoden randomOrder som blandar en array.
	public static void randomOrder(Object[] f){
		Object[] a = new Object[(f.length)];

		for (int i = 0; i < (f.length); i++){
			int slumptal=(int) (Math.random()*(f.length)); //Skapar slumptal, mellan 0 och arrayens l�ngd.
			while (a[slumptal] != null){
				slumptal=(int) (Math.random()*(f.length)); //Om det finns n�got p� index slumptal, slumpas ett nytt tal.
			}
			a[slumptal] = f[i];  //Tilldelar elementet till platsen.
		}

		//Sparar �ver alla element i a till f.
		for (int b = 0; b < (a.length); b++){
			f[b]=a[b];
		}


	}

}
