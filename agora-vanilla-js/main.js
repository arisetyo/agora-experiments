/**
 * 
 * main web app javascript file
 * 
 * @author Arie M. Prasetyo
 * @reference https://www.youtube.com/watch?v=HX6AM_1-jNM by Dennis Ivy
 * 
 */

// log level: 0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG
// create Agora client
const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8", logLevel: 0 });

// list of local tracks (audio/video)
let localTracks = [];

// list of remote users and their audio/video tracks
let remoteUsers = {};


/**
 * 
 * join local stream
 * 
 * - start agora client and join the channel
 * - add event listeners
 * 
 */
let joinAndDisplayLocalStream = async () => {

  // EVENT HANDLERS
  // handle newly joining users
  agoraClient.on('user-published', handleUserJoined);
  // handle leaving users
  agoraClient.on('user-left', handleUserLeft)

  // join the channel and retrieve uid
  let UID = await agoraClient.join(APP_ID, CHANNEL_NAME, null, null);

  // create local audio track and video track from mic and webcam
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  // play LOCAL audio track and video track
  let player = `
    <div class="video-container" id="user-container-${UID}">
      <div class="video-player" id="user-${UID}"></div>
    </div>
  `;

  // append player to DOM
  document.getElementById("video-streams").insertAdjacentHTML('beforeend', player);

  // play local audio track and video track
  localTracks[1].play(`user-${UID}`);

  // publish local tracks to channel
  await agoraClient.publish( [ localTracks[0], localTracks[1] ] );
}

/**
 * subscribe to local stream
 * 
 * start joining an Agora stream and display our local audio vide on the window
 */
let joinStream = async () => {
  await joinAndDisplayLocalStream();

  document.getElementById("join-btn").style.display = "none";
  document.getElementById("stream-controls").style.display = "flex";
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
 */
let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await agoraClient.subscribe(user, mediaType);

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
  await agoraClient.leave();

  document.getElementById('join-btn').style.display = 'block';
  document.getElementById('stream-controls').style.display = 'none';
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
    e.target.innerText = 'Mic on';
    e.target.style.backgroundColor = 'cadetblue';
  } else {
    await localTracks[0].setMuted(true);
    e.target.innerText = 'Mic off';
    e.target.style.backgroundColor = '#EE4B2B';
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
    e.target.innerText = 'Camera on';
    e.target.style.backgroundColor = 'cadetblue';
  } else {
    await localTracks[1].setMuted(true);
    e.target.innerText = 'Camera off';
    e.target.style.backgroundColor = '#EE4B2B';
  }
}

/**
 * 
 * event listeners for interaction buttons
 * 
 */
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);