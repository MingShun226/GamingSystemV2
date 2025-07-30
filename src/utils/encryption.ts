export function decryptPassword(encryptedPassword: string): string {
  try {
    // Step 1: Base64 decode the encrypted password
    const doubleEncoded = atob(encryptedPassword);
    
    // Step 2: Reverse Caesar cipher (shift by -3)
    let decrypted = '';
    for (let i = 0; i < doubleEncoded.length; i++) {
      let char = doubleEncoded.charCodeAt(i);
      // Reverse shift for printable ASCII characters
      if (char >= 32 && char <= 126) {
        char = ((char - 32 - 3 + 95) % 95) + 32;
      }
      decrypted += String.fromCharCode(char);
    }
    
    // Step 3: Base64 decode again to get original password
    return atob(decrypted);
  } catch (error) {
    console.error('Failed to decrypt password:', error);
    throw new Error('Invalid encrypted password');
  }
}