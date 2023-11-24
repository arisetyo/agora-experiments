/**
 * 
 * event listeners for interaction buttons
 * 
 * Refer to main.js for the functions
 * 
 */
document.getElementById('join-btn').addEventListener('click', joinStream);

// events for dynamic buttons
document.body.addEventListener( 'click',  event => {
  switch( event?.target?.id ) {
    case 'exit-btn':
      leaveLocalStream()
      break
    case 'mic-btn':
      toggleOwnMic(event)
      break
    case 'cam-btn':
      toggleOwnCamera(event)
      break
  }
})