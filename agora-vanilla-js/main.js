/**
 * 
 * main web app javascript file
 * 
 * @author Arie M. Prasetyo
 * @reference https://www.youtube.com/watch?v=HX6AM_1-jNM by Dennis Ivy
 * 
 */


// list of local tracks (audio/video)
let localTracks = []
// list of remote users and their audio/video tracks
let remoteUsers = {}
// RTC client
let agoraRTC_Client
// RTM client
let agoraRTM_Client
// RTM channel
let rtmChannel
// the local user's ID
let myId = generateRTMUid()

/**
 * Initialize RTM
 */
const initRtm = async () => {
  // Initialize Agora RTM client
  agoraRTM_Client = await AgoraRTM.createInstance(APP_ID)
  // login to Agora RTM
  await agoraRTM_Client.login({'uid': myId, 'token': null})

  // Immediately join a channel because it's the same as the one we use for RTC
  // and we need to add event handlers here
  rtmChannel = await agoraRTM_Client.createChannel(CHANNEL_NAME)
  await rtmChannel.join()

  // EVENT HANDLERS
  // using RTM to detect user join
  rtmChannel.on('MemberJoined', handleMemberJoined)
}

/**
 * Initialize RTC
 */
const initRtc = async () => {
  // create Agora RTC client
  agoraRTC_Client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8", logLevel: 0 }) // log level: 0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG
  
  // EVENT HANDLERS
  // handle newly joining users
  // agoraRTC_Client.on('user-published', handleUserJoined)
  // handle leaving users
  // agoraRTC_Client.on('user-left', handleUserLeft)
}

/**
 * Initialize the app
 * 
 * Make sure to initialize both RTC and RTM, but the RTC first because we create the RTM client instance here
 */
const init = async () => {
  await initRtc()
  await initRtm()
}

/**
 * 
 * join local stream
 * 
 * - start agora client and join the channel
 * - add event listeners
 * 
 */
let joinAndDisplayLocalStream = async () => {
  // join the channel for RTC
  let UID = await agoraRTC_Client.join(APP_ID, CHANNEL_NAME, null, null);

  // create local audio track and video track from mic and webcam
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  // play LOCAL audio track and video track
  let player = `
    <div class="video-container" id="user-container-${UID}">
      <div class="video-player" id="user-${UID}"></div>
      <div class="action-ui">
        <button><img id="mic-btn" width="20px" height="20px" src="img/mic.png"/></button>
        <button><img id="cam-btn" width="20px" height="20px" src="img/cam.png"/></button>
        <button><img id="exit-btn" width="20px" height="20px" src="img/leave.svg"/></button>
      </div>
      <span class="user-id">ID: ${myId}</span>
    </div>
  `;
  // append player to DOM
  document.getElementById("video-streams").insertAdjacentHTML('beforeend', player);
  // play local audio track and video track
  localTracks[1].play(`user-${UID}`);
  // publish local tracks to channel
  await agoraRTC_Client.publish( [ localTracks[0], localTracks[1] ] );
}

/**
 * subscribe to local stream
 * 
 * start joining an Agora stream and display our local audio vide on the window
 */
let joinStream = async () => {
  await initRtc()
  await initRtm()

  // start joining the stream via Agora RTC
  await joinAndDisplayLocalStream();

  document.getElementById("join-btn").style.display = "none";
}

/**
 * handle remote user who joined
 * 
 * when Agora tells us that there's another remote user joined the stream
 * we put their user info (including audio video track) into our remoteUsers object
 * and put their tracks into the current user's own active window
 * 
 * @param {*} user 
 * @param {*} mediaType 
 * /
let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await agoraRTC_Client.subscribe(user, mediaType);

  if (mediaType === 'video') {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) {
      player.remove();
    }

    player = `
      <div class="video-container" id="user-container-${user.uid}">
        <div class="video-player" id="user-${user.uid}"></div>
      </div>
    `;
    document.getElementById("video-streams").insertAdjacentHTML('beforeend', player);

    // play this user's video track using the selected video container
    user.videoTrack.play(`user-${user.uid}`);

    // play this user's audio track
    if (mediaType === 'audio') user.audioTrack.play();
  }
} */
const handleMemberJoined = async (tmp) => {
  console.log('- - - - - - - - \n\n')
  console.log('>>>>MemberJoined<<<')
  console.log(tmp)
  console.log('\n\n- - - - - - - - ')
}

/**
 * handle remote user who left
 * 
 * basically let the active window that there's another user that left
 * and remove that user's video from our window
 * @param {*} user 
 */
let handleUserLeft = async user => {
  delete remoteUsers[user.uid]
  document.getElementById(`user-container-${user.uid}`).remove();
}

/**
 * leave channel and remove local stream
 * 
 * this what actually happens when you click the leave button
 * the user's local mic and camera will be stopped and the user leaves the stream
 */
let leaveAndRemoveLocalStream = async () => {
  // stop & close user's audio video tracks
  for(let i = 0; localTracks.length > i; i++){
    localTracks[i].stop();
    localTracks[i].close();
  }

  // user actually leave the stream
  await agoraRTC_Client.leave();

  document.getElementById('join-btn').style.display = 'block';
  document.getElementById('video-streams').innerHTML = '';
}

/**
 * toggle mic
 * 
 * toggle user's audio input
 * 
 * @param {*} e 
 */
let toggleMic = async e => {
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    e.target.style.opacity = '1';
  } else {
    await localTracks[0].setMuted(true);
    e.target.style.opacity = '0.1';
  }
}

/**
 * toggle camera
 * 
 * toggle user's video input
 * 
 * @param {*} e 
 */
let toggleCamera = async e => {
  if(localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    e.target.style.opacity = '1';
  } else {
    await localTracks[1].setMuted(true);
    e.target.style.opacity = '0.1';
  }
}

// initialize the RTC/RTM clients
init()

