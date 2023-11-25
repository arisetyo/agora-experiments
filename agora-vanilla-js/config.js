const APP_ID = 'bc1a95523dbb4680ae2687d1addd482d';

const CHANNEL_NAME = 'Test';

/**
 * Generate an alphanumeric RTM uid
 * 
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