/**
 * 
 * main web app javascript file
 * 
 * @author Arie M. Prasetyo
 * @reference https://www.youtube.com/watch?v=HX6AM_1-jNM by Dennis Ivy
 * 
 */

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// list of audio tracks
let Tracks = {
  // list of local tracks (audio/video)
  localTracks: [],
  // list of remote users and their audio/video tracks
  remoteTracks: {},
}

// RTC client
let agoraRTC_Client
// RTM client
let agoraRTM_Client
// RTM channel
let agoraRTM_Channel
// channel members
let channelMembers = []
// channel uids
let channelUids = []
// the local user's ID
let myId = generateRTMUid()

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialize RTM
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const INIT_RTM = async () => {
  // Initialize Agora RTM client
  agoraRTM_Client = await AgoraRTM.createInstance(APP_ID)
  // login to Agora RTM
  await agoraRTM_Client.login({'uid': myId, 'token': null})

  // Immediately join a channel because it's the same as the one we use for RTC
  // and we need to add event handlers here
  agoraRTM_Channel = await agoraRTM_Client.createChannel(CHANNEL_NAME)
  await agoraRTM_Channel.join()

  // get channel members
  getChannelMembers()

  /**
   * EVENT HANDLERS
   */
  // using RTM to detect user join
  agoraRTM_Channel.on('MemberJoined', handleMemberJoined)
  // using RTM to detect user leave
  agoraRTM_Channel.on('MemberLeft', handleMemberLeft)
  // leave channel when user closes the window
  window.addEventListener('beforeunload', leaveLocalStream)
}


/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialize RTC
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const INIT_RTC = async () => {
  // create Agora RTC client
  agoraRTC_Client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8", logLevel: 0 }) // log level: 0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG

  /**
   * EVENT HANDLERS
   */
  agoraRTC_Client.on("user-published", handleUserPublished)
  agoraRTC_Client.on("user-left", handleUserLeft)
}


/**
 * 
 * */
const joinStream = async () => {
  // join the channel for RTC
  const rtcUid = await agoraRTC_Client.join(APP_ID, CHANNEL_NAME, null, null);

  let player = `
    <div class="video-container" id="user-container-${rtcUid}">
      <div class="video-player" id="user-${rtcUid}"></div>
      <div class="action-ui">
        <button><img id="mic-btn" width="20px" height="20px" src="img/mic.png"/></button>
        <button><img id="cam-btn" width="20px" height="20px" src="img/cam.png"/></button>
        <button><img id="exit-btn" width="20px" height="20px" src="img/leave.svg"/></button>
      </div>
      <span class="user-id">ID: ${rtcUid}</span>
    </div>
  `
  // append player to DOM
  await document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

  // create local audio track and video track from mic and webcam
  Tracks.localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
  // start muted
  await Tracks.localTracks[0].setMuted(true)
  // play local tracks
  await Tracks.localTracks[1].play(`user-${rtcUid}`)

  // publish local tracks to channel
  await agoraRTC_Client.publish([ Tracks.localTracks[0], Tracks.localTracks[1] ])

  // hide join button
  document.getElementById("join-btn").style.display = "none"
}


/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * subscribe to local stream
 * 
 * start joining an Agora stream and display our local audio vide on the window
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
let init = async () => {
  await INIT_RTM()
  await INIT_RTC()
}

/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * handle user published
 * 
 * when Agora tells us that there's another remote user published their stream
 * 
 * @param {*} user 
 * @param {*} mediaType 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const handleUserPublished = async (user, mediaType) => {
  // add to remote tracks
  Tracks.remoteTracks[user.uid] = user

  // subscribe to this user's stream
  await agoraRTC_Client.subscribe(user, mediaType)

  // play this user's audio track
  if (mediaType == "audio"){
    Tracks.remoteTracks[user.uid] = [user.audioTrack]
    user.audioTrack.play()
  }

  // play this user's video track using the selected video container
  if (mediaType === 'video') {
    // check whether the player already exists
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) player.remove()

    player = `
      <div class="video-container" id="user-container-${user.uid}">
        <div class="video-player" id="user-${user.uid}"></div>
        <span class="user-id">ID: ${user.uid}</span>
      </div>
    `
    // append player to DOM
    await document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

    user.videoTrack.play(`user-${user.uid}`)
  }
}

/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * handle user left
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * */
const handleUserLeft = async (user) => {
  delete Tracks.remoteTracks[user.uid]
  document.getElementById(`user-container-${user.uid}`).remove()
}


/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * handle remote user who joined RTM channel
 * 
 * @param {*} user 
 * @param {*} mediaType 
 *  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const handleMemberJoined = async memberId => {
  // TMP
  console.log('member joined', memberId)
}

/**
 * handle remote user who left
 * 
 * basically let the active window that there's another user that left from RTM channel
 * @param {*} user 
 */
const handleMemberLeft = async memberId => {
  // TMP
  console.log('member left', memberId)
}

/**
 * Leave the RTM channel
 */
const leaveRtmChannel = async () => {
  await agoraRTM_Channel.leave()
  await agoraRTM_Client.logout()
}


/**
 * 
 * read all the members in the channel
 * 
 * this is called when the user first joins the channel
 */
const getChannelMembers = async () => {
  // get members from RTM channel
  channelMembers = await agoraRTM_Channel.getMembers()
}

/**
 * leave channel and remove local stream
 * 
 * this what actually happens when you click the leave button
 * the user's local mic and camera will be stopped and the user leaves the stream
 */
const leaveLocalStream = async () => {
  // stop local tracks
  Tracks.localTracks[0].stop()
  Tracks.localTracks[1].stop()
  Tracks.localTracks[0].close()
  Tracks.localTracks[1].close()

  // user actually leave the RTC stream
  await agoraRTC_Client.unpublish()
  await agoraRTC_Client.leave()

  // user actually leave the RTM channel
  leaveRtmChannel()

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
let toggleOwnMic = async e => {
  if (Tracks.localTracks[0].muted) {
    await Tracks.localTracks[0].setMuted(false)
    e.target.style.opacity = '1';
  } else {
    await Tracks.localTracks[0].setMuted(true)
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
let toggleOwnCamera = async e => {
  if(Tracks.localTracks[1].muted) {
    await Tracks.localTracks[1].setMuted(false);
    e.target.style.opacity = '1';
  } else {
    await Tracks.localTracks[1].setMuted(true);
    e.target.style.opacity = '0.1';
  }
}

// start the app
init()