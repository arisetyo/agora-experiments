
/**
 * Generates a random string of the specified length.
 *
 * @param {number} length - The length of the random string to generate.
 * @returns {string} The generated random string.
 *
 * @example
 * // Generate a random string of length 8
 * const randomString = generateRandomString(8);
 * console.log(randomString); // Output: "aB3cD9eF"
 */
export const generateRandomString = length => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}
