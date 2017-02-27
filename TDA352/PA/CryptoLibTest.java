// Compilation:
//   javac PA.CryptoLibTest.java
// Running:
//   java PA.CryptoLibTest

public class CryptoLibTest {

	static int TestEEA(int a, int b, int gcd, int s, int t) {
		int[] res = CryptoLib.EEA(a, b);
		if (res[0] == gcd && res[1] == s && res[2] == t) {
			return 0;
		}
		System.out.println("EEA failed for input " + a + "," + b + ". Got "
				+ res[0] + "," + res[1] + "," + res[2]
				+ " expected values were " + gcd + "," + s + "," + t);
		return 1;
	}

	static void TestEEA() {
		int errors = 0;
		errors += TestEEA(5, 5, 5, 1, 0);
		errors += TestEEA(18, 1, 1, 0, 1);
		errors += TestEEA(1, 18, 1, 1, 0);
		errors += TestEEA(21, 22, 1, -1, 1);
		errors += TestEEA(157, 111, 1, -41, 58);
		errors += TestEEA(6, 68, 2, -11, 1);
		errors += TestEEA(12, 36, 12, 1, 0);
		errors += TestEEA(42, 25, 1, 3, -5);
		errors += TestEEA(150, 340, 10, -9, 4);
		System.out.println("Total errors in the EEA function " + errors);

	}

	static int TestEulerPhi(int input, int expected) {
		if (CryptoLib.EulerPhi(input) == expected)
			return 0;
		System.out.println("EulerPhi failed for input " + input + ". Got "
				+ CryptoLib.EulerPhi(input) + " expected " + expected);
		return 1;
	}

	static void TestEulerPhi() {
		int errors = 0;
		errors += TestEulerPhi(-1, 0);
		errors += TestEulerPhi(13, 12);
		errors += TestEulerPhi(57, 36);
		errors += TestEulerPhi(111, 72);
		errors += TestEulerPhi(1000, 400);
		errors += TestEulerPhi(157, 156);
		System.out.println("Total errors in the EulerPhi function " + errors);

	}

	static int TestModInv(int n, int mod, int inv) {
		if (CryptoLib.ModInv(n, mod) == inv)
			return 0;
		System.out.println("ModInv failed for input " + n + " and " + mod
				+ ". Got " + CryptoLib.ModInv(n, mod) + " expected " + inv);
		return 1;
	}

	static void TestModInv() {
		int errors = 0;
		errors += TestModInv(25, 42, 37);
		errors += TestModInv(11, 20, 11);
		errors += TestModInv(13, 50, 27);
		errors += TestModInv(8954, 123, 59);
		errors += TestModInv(-9, 823, 640);
		System.out.println("Total errors in the ModInv function " + errors);

	}

	static int TestFermatPT(int n, int expected) {
		if (CryptoLib.FermatPT(n) == expected)
			return 0;
		System.out.println("FermatPT failed for input " + n + ". Got "
				+ CryptoLib.FermatPT(n) + " expected " + expected);
		return 1;
	}

	static void TestFermatPT() {
		int errors = 0;
		errors += TestFermatPT(7, 0);
		errors += TestFermatPT(12, 2);
		errors += TestFermatPT(53, 0);
		errors += TestFermatPT(111, 2);
		errors += TestFermatPT(157, 0);
		errors += TestFermatPT(158, 2);
		errors += TestFermatPT(341, 3);
		errors += TestFermatPT(1105, 5);
		errors += TestFermatPT(2821, 7);
		System.out.println("Total errors in the FermatPT function " + errors);
	}

	static int TestHashCP(double n, double s, double expected) {
		if (CryptoLib.HashCP(n, s) - expected < 0.0000005
				&& CryptoLib.HashCP(n, s) - expected > -0.0000005)
			return 0;
		System.out.println("HashCP failed for input " + n + " and " + s
				+ ". Got " + CryptoLib.HashCP(n, s) + " expected " + expected);
		return 1;
	}

	static void TestHashCP() {
		int errors = 0;
		errors += TestHashCP(24, 356, 0.547481);
		errors += TestHashCP(100, 4096, 0.704298);
		errors += TestHashCP(128, 128, 1);
		errors += TestHashCP(10, 8202, 0.00547355);
		System.out.println("Total errors in the HashCP function " + errors);

	}

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		TestEEA();
		TestEulerPhi();
		TestModInv();
		TestFermatPT();
		TestHashCP();
	}

}
