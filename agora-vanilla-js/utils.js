/**
 * Generate an alphanumeric RTM uid
 * 
 * @param {number} length - The length of the uid to generate
 * @returns {string} - The generated alphanumeric uid
 */
const generateRTMUid = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uid = '';
  for (let i = 0; i < 6; i++) {
    uid += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `USR-${uid}`;
}