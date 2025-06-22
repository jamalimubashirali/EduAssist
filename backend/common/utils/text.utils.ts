export class TextUtils {
  /**
   * Capitalizes the first letter of each word (Title Case)
   * @param text - The text to capitalize
   * @returns Capitalized text
   */
  static toTitleCase(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  /**
   * Capitalizes only the first letter of the entire string
   * @param text - The text to capitalize
   * @returns Capitalized text
   */
  static toSentenceCase(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase().trim();
  }

  /**
   * Removes extra spaces and trims the text
   * @param text - The text to clean
   * @returns Cleaned text
   */
  static cleanText(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\s+/g, ' ').trim();
  }
}