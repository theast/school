import java.io.*;

import javax.xml.bind.DatatypeConverter;

public class CBCXor {

    public static int index = 0;

    public static void main(String[] args) {
        String filename = "input.txt";
        byte[] first_block = null;
        byte[] encrypted = null;
        try {
            BufferedReader br = new BufferedReader(new FileReader(filename));
            first_block = br.readLine().getBytes();
            encrypted = DatatypeConverter.parseHexBinary(br.readLine());
            br.close();
        } catch (Exception err) {
            System.err.println("Error handling file.");
            err.printStackTrace();
            System.exit(1);
        }
        String m = recoverMessage(first_block, encrypted);
        System.out.println("Recovered message: " + m);
    }

    /**
     * Recover the encrypted message (CBC encrypted with XOR, block size = 12).
     *
     * @param first_block
     *            We know that this is the value of the first block of plain
     *            text.
     * @param encrypted
     *            The encrypted text, of the form IV | C0 | C1 | ... where each
     *            block is 12 bytes long.
     */
    private static String recoverMessage(byte[] first_block, byte[] encrypted) {
        byte[] key = findKey(first_block, encrypted);
        index = 0;
        byte[] message = findMessage(key, encrypted);

        return new String(message);
    }

    public static byte[] findMessage(byte[] key, byte[] encrypted) {
        int retIndex = 0;
        byte[] ret = new byte[encrypted.length-12];
        byte[] prevC = getFirst12Bytes(encrypted);

        while (encrypted.length-12 >= index){
            byte[] c = getFirst12Bytes(encrypted);
            byte[] bytes = xor12Bytes(c, key);
            bytes = xor12Bytes(bytes, prevC);
            prevC = c;

            int retSize = retIndex + 12;
            for (int i = 0; retIndex < retSize; retIndex++)
                ret[retIndex] = bytes[i++];
        }

        return ret;
    }

    public static byte[] findKey(byte[] first_block, byte[] encrypted) {
        byte[] IV = getFirst12Bytes(encrypted);
        byte[] c0 = getFirst12Bytes(encrypted);
        byte[] key = xor12Bytes(IV, first_block);
        key = xor12Bytes(key, c0);
        return key;
    }

    public static byte[] getFirst12Bytes(byte[] bytes) {
        byte[] ret = new byte[12];
        int indexSize = index+12;
        for (int i = 0; index < indexSize; index++)
            ret[i++] = bytes[index];
        return ret;
    }

    public static byte[] xor12Bytes(byte[] a1, byte[] a2){
        byte[] ret = new byte[12];
        for (int i = 0; i < 12; i++)
            ret[i] = (byte) (0xff & (a1[i] ^ a2[i]));
        return ret;
    }
}
