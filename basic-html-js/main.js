// main web app javascript file

// create Agora client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// list of local tracks (audio/video)
let localTracks = [];

// list of remote users and their audio/video tracks
let remoteUsers = {};

// join local stream
let joinAndDisplayLocalStream = async () => {
  // join the channel and retrieve uid
  let UID = await client.join(APP_ID, CHANNEL_NAME, TEMP_TOKEN, null);

  // create local audio track and video track from mic and webcam
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  // play LOCAL audio track and video track
  let player = `
    <div class="video-container" id="user-container-${UID}">
      <div class="video-player" id="user-${UID}"></div>
      <div class="player-name">Me</div>
    </div>
  `;

  // append player to DOM
  document.getElementById("video-streams").insertAdjacentHTML('beforeend', player);

  // play local audio track and video track
  localTracks[1].play(`user-${UID}`);

  // publish local tracks to channel
  await client.publish(localTracks[0], localTracks[1]);
}

// subscribe to remote stream
let joinStream = async () => {
  await joinAndDisplayLocalStream();

  document.getElementById("join-btn").style.display = "none";
  document.getElementById("stream-controls").style.display = "flex";
}

// add event listener to #join-btn button
document.getElementById("join-btn").addEventListener("click", joinStream);