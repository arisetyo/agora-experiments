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
      leaveAndRemoveLocalStream()
      break
    case 'mic-btn':
      toggleMic(event)
      break
    case 'cam-btn':
      toggleCamera(event)
      break
  }
})