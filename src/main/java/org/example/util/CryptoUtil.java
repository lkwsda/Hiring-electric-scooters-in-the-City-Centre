package org.example.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class CryptoUtil {

    private static final String ALGORITHM = "AES";
    private static String secretKey;

    public static void setSecretKey(String key) {
        // Pad or truncate to 16 bytes for AES-128
        byte[] keyBytes = new byte[16];
        byte[] inputBytes = key.getBytes();
        int len = Math.min(inputBytes.length, 16);
        System.arraycopy(inputBytes, 0, keyBytes, 0, len);
        secretKey = Base64.getEncoder().encodeToString(keyBytes);
    }

    public static String encrypt(String plainText) {
        if (plainText == null || secretKey == null) return plainText;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(Base64.getDecoder().decode(secretKey), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public static String decrypt(String encryptedText) {
        if (encryptedText == null || secretKey == null) return encryptedText;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(Base64.getDecoder().decode(secretKey), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decrypted);
        } catch (Exception e) {
            return encryptedText; // fallback: return as-is (old plaintext data)
        }
    }
}
