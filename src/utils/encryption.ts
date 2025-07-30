export function decryptPassword(encryptedPassword: string): string | null {
  try {
    // Step 1: Base64 decode
    const step1 = atob(encryptedPassword);
    
    // Step 2: Reverse Caesar cipher (shift back by 3)
    let decrypted = '';
    for (let i = 0; i < step1.length; i++) {
      let char = step1.charCodeAt(i);
      // Reverse shift for printable ASCII characters
      if (char >= 32 && char <= 126) {
        char = ((char - 32 - 3 + 95) % 95) + 32;
      }
      decrypted += String.fromCharCode(char);
    }
    
    // Step 3: Base64 decode again to get original password
    return atob(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

export function clearUrlParameters(): void {
  if (window.history && window.history.replaceState) {
    const urlWithoutParams = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, urlWithoutParams);
  }
}