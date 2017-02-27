// Compilation (PA.CryptoLibTest contains the main-method):
//   javac PA.CryptoLibTest.java
// Running:
//   java PA.CryptoLibTest

public class CryptoLib {

	/**
	 * Returns an array "result" with the values "result[0] = gcd",
	 * "result[1] = s" and "result[2] = t" such that "gcd" is the greatest
	 * common divisor of "a" and "b", and "gcd = a * s + b * t".
	 **/
	public static int[] EEA(int a, int b) {
		// Note: as you can see in the test suite,
		// your function should work for any (positive) value of a and b.

        int s = 0, prevS = 1, t = 1, prevT = 0;
        int[] result = new int[3];

        if (a != b) {
            while (b != 0) {
                int q = a / b;
                int r = a % b;

                a = b;
                b = r;

                int temp = s;
                s = prevS - q * temp;
                prevS = temp;

                temp = t;
                t = prevT - q * temp;
                prevT = temp;
            }
            result[0] = a;
            result[1] = prevS;
            result[2] = prevT;
        } else {
            result[0] = a;
            result[1] = 1;
            result[2] = 0;
        }

		return result;
	}

	/**
	 * Returns Euler's Totient for value "n".
	 **/
	public static int EulerPhi(int n) {
        int count = 0;
        for (int i = 1; i < n; i++) {
            if (EEA(n, i)[0] == 1)
                count++;
        }
        return count;
	}

	/**
	 * Returns the value "v" such that "n*v = 1 (mod m)". Returns 0 if the
	 * modular inverse does not exist.
	 **/
	public static int ModInv(int n, int m) {
        int[] result = EEA(m, n+m);
        if (result[0] == 1)
            return (result[2] + m) % m;
        return 0;
	}

	/**
	 * Returns 0 if "n" is a Fermat Prime, otherwise it returns the lowest
	 * Fermat Witness. Tests values from 2 (inclusive) to "n/3" (exclusive).
	 **/
	public static int FermatPT(int n) {
        for (int a = 2; a < n / 3; a++)
            if (powMod(a, n-1, n) != 1)
                return a;
        return 0;
	}

    public static int powMod(int b, int p, int m) {
        int ret = 1;
        while(p-- > 0)
            ret = ret * b % m;
        return ret;
    }

	/**
	 * Returns the probability that calling a perfect hash function with
	 * "n_samples" (uniformly distributed) will give one collision (i.e. that
	 * two samples result in the same hash) -- where "size" is the number of
	 * different output values the hash function can produce.
	 **/
	public static double HashCP(double n_samples, double size) {
        double prob = 1;
        for (double i = size-1; i >= size-(n_samples-1); i--)
            prob *= i/size;
        return 1-prob;
	}

}
