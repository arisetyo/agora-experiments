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

// my id
const myRtmId = generateRTMUid()
// my rtc ID
let myRtcId

/**
 * 
 * Remote channel members. We use this to remove the player when the user leaves.
 * This is because the user's RTC ID is different from the user's RTM ID.
 * 
 * Object structure:
 * 
  {
    remoteMemberRtcId: <user's rtc id>,
    remoteMemberId: <user's rtm id>
  }
 *
 *
 * */
let remoteMembers = []

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
  await agoraRTM_Client.login({'uid': myRtmId, 'token': null})

  // Immediately join a channel because it's the same as the one we use for RTC
  // and we need to add event handlers here
  agoraRTM_Channel = await agoraRTM_Client.createChannel(CHANNEL_NAME)
  await agoraRTM_Channel.join()

  /**
   * EVENT HANDLERS
   */
  // using RTM to detect user message
  agoraRTM_Channel.on('ChannelMessage', handleChannelMessage)
  // log out of channel when user closes the window
  window.addEventListener('beforeunload', logoutChannel)
  // using RTM to detect user join
  // -
  // using RTM to detect user leave
  // -
}


/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialize RTC
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const INIT_RTC = async () => {
  AgoraRTC.setParameter('AUDIO_VOLUME_INDICATION_INTERVAL', 200);

  // create Agora RTC client
  agoraRTC_Client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8", logLevel: 0 }) // log level: 0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG
  agoraRTC_Client.enableAudioVolumeIndicator()

  /**
   * EVENT HANDLERS
   */
  // handle newly joining users via RTC that contains their audio and video tracks
  agoraRTC_Client.on("user-published", handleUserPublished)
  // handle leaving users via RTC
  agoraRTC_Client.on("user-left", handleUserLeft)
  // handle volume change
  agoraRTC_Client.on("volume-indicator", volumeIndicatorHandler)
}


/**
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * subscribe to local stream
 * 
 * start joining an Agora stream and display our local audio vide on the window
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
const joinRoom = async () => {
  // join the channel for RTC
  myRtcId = await agoraRTC_Client.join(APP_ID, CHANNEL_NAME, null, null);

  // create player for local stream
  let player = `
    <div class="video-container" id="user-container-${myRtmId}">
      <div class="video-player" id="user-${myRtmId}"></div>
      <div class="action-ui">
        <button><img id="mic-btn" width="20px" height="20px" src="img/mic.png"/></button>
        <button><img id="cam-btn" width="20px" height="20px" src="img/cam.png"/></button>
        <button><img id="exit-btn" width="20px" height="20px" src="img/leave.svg"/></button>
      </div>
      <span class="user-id">ID: ${myRtmId}</span>
    </div>
  `
  // append player to DOM
  await document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

  /**
   * 
   * create local audio track and video track from mic and webcam
   * and then publish it to the channel
   * 
   */
  // create local audio and video tracks
  Tracks.localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
  // start muted
  await Tracks.localTracks[0].setMuted(true)
  // play local tracks
  await Tracks.localTracks[1].play(`user-${myRtmId}`)
  // PUBLISH local tracks to channel
  await agoraRTC_Client.publish([ Tracks.localTracks[0], Tracks.localTracks[1] ])

  // hide join button
  document.getElementById("join-btn").style.display = "none"

  // send myRtcId and myId to other members in the channel
  // Wait for 6 seconds before sending the message to make sure its tracks are PUBLISHED
  let countdown = 6

  let timer = document.getElementById("timer")
  timer.style.display = "block"
  
  const myInterval = setInterval(() => {
    if (countdown === 0) {
      agoraRTM_Channel.sendMessage({text: JSON.stringify({myRtcId, type: "REMOTE_JOINED_BROADCAST"})})
      timer.style.display = "none"
      clearInterval(myInterval)
      countdown = 6
      return
    }
    
    // show countdown in timer layer
    timer.innerHTML = countdown
    countdown -= 1
  }, 1000)
}

/**
 * main function to start the app
 * */
const init = async () => {
  // init RTM and join a channel
  await INIT_RTM()

  // init RTC
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
  Tracks.remoteTracks[user.uid] = {user, mediaType}

  // subscribe to this user's stream
  await agoraRTC_Client.subscribe(user, mediaType)

  // We are not playing the video here because we want to wait for the RTM message
  // so we know the combination of the user's RTM ID and RTC ID.
  // But that means new users will not see the video of the existing users.
  // This we need to check whether the user is already in the remoteMembers list.
  const channelMembers = await agoraRTM_Channel.getMembers()
  if (remoteMembers.length > 0) {
    // loop through remoteMembers
    remoteMembers.forEach(remoteMember => {
      // if the remoteMember is in the members list, then play the video
      if (channelMembers.includes(remoteMember.remoteMemberId)) {
        // get user and mediaType from Tracks.remoteTracks
        let remoteTrack = Tracks.remoteTracks[remoteMember.remoteMemberRtcId]
        
        if (remoteTrack && remoteTrack !== null) {
          let {user, mediaType} = remoteTrack

          if (mediaType == "audio"){
            user.audioTrack.play()
          }

          // play this user's video track using the selected video container
          if (mediaType === 'video') {
            // check whether the player already exists
            let player = document.getElementById(`user-container-${remoteMember.remoteMemberId}`);
            if (player != null) player.remove()

            player = `
              <div class="video-container" id="user-container-${remoteMember.remoteMemberId}">
                <div class="video-player" id="user-${remoteMember.remoteMemberId}"></div>
                <span class="user-id">ID: ${remoteMember.remoteMemberId}</span>
              </div>
            `
            // append player to DOM
            document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

            user.videoTrack.play(`user-${remoteMember.remoteMemberId}`)
          }
        }
      }
    })
  }

}

/**
 * handle channel message from RTM
 * 
 * if the message is a REMOTE_JOINED_BROADCAST, then play the user's video track
 * other message could be handled herem eg. MUTE_REMOTE_USER_MIC
 */
const handleChannelMessage = async (message, memberId) => {
  // parse message
  const {myRtcId, type} = JSON.parse(message.text)

  // add to remote members
  remoteMembers.push({remoteMemberRtcId: myRtcId, remoteMemberId: memberId})

  if (type === "REMOTE_JOINED_BROADCAST") {
    // get user and mediaType from Tracks.remoteTracks
    let remoteTrack = Tracks.remoteTracks[myRtcId]
    
    if (remoteTrack && remoteTrack !== null) {
      let {user, mediaType} = remoteTrack

      if (mediaType == "audio"){
        user.audioTrack.play()
      }

      // play this user's video track using the selected video container
      if (mediaType === 'video') {
        // check whether the player already exists
        let player = document.getElementById(`user-container-${memberId}`);
        if (player != null) player.remove()

        player = `
          <div class="video-container" id="user-container-${memberId}">
            <div class="video-player" id="user-${memberId}"></div>
            <span class="user-id">ID: ${memberId}</span>
          </div>
        `
        // append player to DOM
        await document.getElementById("video-streams").insertAdjacentHTML('beforeend', player)

        user.videoTrack.play(`user-${memberId}`)
      }
    }

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

  remoteMember = remoteMembers.find(remoteMember => remoteMember.remoteMemberRtcId === user.uid)
  document.getElementById(`user-container-${remoteMember.remoteMemberId}`).remove()
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

/**
 * leave RTM channel
 */
const logoutChannel = async () => {
  await agoraRTM_Client.logout()
}

/**
 * leave channel and remove local stream
 * 
 * this what actually happens when you click the leave button
 * the user's local mic and camera will be stopped and the user leaves the stream
 */
const leaveRoom = async () => {
  // stop local tracks
  Tracks.localTracks[0].stop()
  Tracks.localTracks[1].stop()
  Tracks.localTracks[0].close()
  Tracks.localTracks[1].close()

  // user actually leave the RTC stream
  await agoraRTC_Client.unpublish()
  await agoraRTC_Client.leave()

  // user actually leave the RTM channel
  await agoraRTM_Channel.leave()

  document.getElementById('join-btn').style.display = 'block';
  document.getElementById('video-streams').innerHTML = '';
}

/**
 * Handle volume change event.
 * @param {*} volumes 
 */
const volumeIndicatorHandler = volumes => {
  volumes.forEach( volume => {
    if (remoteMembers.length > 0) {
      // get the remoteMemberId using volume.uid
      let remoteMember = remoteMembers.find(remoteMember => remoteMember.remoteMemberRtcId === volume.uid)

      if (!remoteMember) return

      // get the video container of that member id
      try {
        let player = document.getElementById(`user-container-${remoteMember.remoteMemberId}`);

        if (!player) return

        if (volume.level >= 50){
          player.style.borderColor = '#00ff00'
        } else {
          player.style.borderColor = "unset"
        }
      } catch(error) {
        console.error(error)
      }
    }
  })
}

// * * * * * * * * * * * * * * * * * * * * 
// initialize to start the app
// * * * * * * * * * * * * * * * * * * * *
init()