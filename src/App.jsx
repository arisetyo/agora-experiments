import AgoraRTC from 'agora-rtc-sdk-ng'
import { useEffect, useRef, useState } from 'react'

import VideoPlayer from './VideoPlayer'
import { generateRandomString } from './utils'

import styles from './App.module.scss'

const APP_ID = "bc1a95523dbb4680ae2687d1addd482d"
const CHANNEL_NAME = "test"

/**
 * The main component of the application.
 *
 * @component
 * @returns {JSX.Element} The rendered App component.
 */
const App = () => {
  // id received from Agora after joining a channel
  const [userChannelId, setUserChannelId] = useState(null)
  // list of tracks (audio/video)
  const [tracks, setTracks] = useState([])
  // local track
  const [localTrack, setLocalTrack] = useState([])
  // join status
  const [joined, setJoined] = useState(false)
  // list of remote users and their audio/video tracks
  const [remoteUsers, setRemoteUsers] = useState({})

  const myId = `User-${generateRandomString(6)}`

  // the AgoraRTC client
  // create a ref
  const RefClientRTC = useRef()

  useEffect(() => {
    let client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
    RefClientRTC.current = client

    // EVENT HANDLERS
    // handle newly joining users
    client.on('user-published', handleUserJoined)

  }, [])


  /**
   * Join the channel and retrieve uid
   */
  const joinHandler = async () => {
    const client = RefClientRTC.current
    const joinID = await client.join(APP_ID, CHANNEL_NAME, null, null)
    
    await setUserChannelId(joinID)

    // create local audio track and video track from mic and webcam
    const lt = await AgoraRTC.createMicrophoneAndCameraTracks()
    setLocalTrack(lt)
    await setTracks([...tracks, {type: "LOCAL", trackSource: lt, trackID: String(joinID)}])

    // publish local tracks to channel
    await client.publish( [ lt[0], lt[1] ] )

    setJoined(true)
  }


  /**
   * Handler for leaving local stream
   */
  const leaveHandler = async () => {
    const lt = localTrack
    lt[0].stop()
    lt[0].close()
    lt[1].stop()
    lt[1].close()
    setLocalTrack([])

    const client = RefClientRTC.current
    await client.leave()

    setJoined(false)
  }

  /**
   * handle newly joining users
   */
  const handleUserJoined = async (user, mediaType) => {
    // subscribe to remote user
    setRemoteUsers({...remoteUsers, [user.uid]: user})

    const client = RefClientRTC.current
    await client.subscribe(user, mediaType)

    // play this user's audio track
    if (mediaType === 'audio') user.audioTrack.play()

    if (mediaType === 'video') {
      await setTracks([...tracks, {type: "REMOTE", trackSource: user, trackID: String(user.uid)}])
    }
  }

  return (
    <div className={styles.App}>
      <h1>Video calling using Agora</h1>
      <p>This is a proof of concept for video calling, using React and Agora`s RTM (signalling) & RTC libraries</p>
      <div className={styles.status}>
        <p>My ID: <span>{myId}</span></p>
        <p>Channel ID: <span>{userChannelId}</span></p>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={e => {
            e.preventDefault()
            !joined ? joinHandler() : leaveHandler()
          }}
        >
          {joined ? "Leave" : "Join"}
        </button>
      </div>

      <div className={styles.videos}>
        {
          tracks && tracks.map((track, index) => (
            <VideoPlayer
              key={index}
              track={track}
            />
          ))
        }
      </div>
    </div>
  )
}

export default App
