/**
 * 
 * event listeners for interaction buttons
 * 
 * Refer to main.js for the functions
 * 
 */
document.getElementById('join-btn').addEventListener('click', joinRoom);

// events for dynamic buttons
document.body.addEventListener( 'click',  event => {
  switch( event?.target?.id ) {
    case 'exit-btn':
      leaveRoom()
      break
    case 'mic-btn':
      toggleOwnMic(event)
      break
    case 'cam-btn':
      toggleOwnCamera(event)
      break
    case 'mic-btn-guest':
      toggleGuestMic(event.target.getAttribute("data-member"))
      break
    case 'cam-btn-guest':
      toggleGuestCam(event.target.getAttribute("data-member"))
      break
  }
})