import PropTypes from 'prop-types'
import styles from './VideoPlayer.module.scss'
import { useEffect } from 'react'

/**
 * The VideoPlayer component.
 * 
 * @component
 * @param {Object} props - The props of the component.
 * @param {Object} props.track - The track object.
 * @param {string} props.track.type - The type of track (LOCAL or REMOTE).
 * @param {Object[]} props.track.trackSource - The track source.
 * @param {string} props.track.trackID - The track ID.
 * */
const VideoPlayer = ({ track: {type, trackSource, trackID} }) => {

  // play local audio track and video track
  useEffect(() => {
    if (trackSource) {
      if (type === "LOCAL") {
        trackSource[0].play()
        trackSource[1].play(`user-${trackID}`)
      } else if (type === "REMOTE") {
        trackSource.videoTrack.play(`user-${trackID}`)
        trackSource.audioTrack.play();
      }
    }

  }, [type, trackSource, trackID])

  return (
    <div
      className={styles.VideoPlayer}
      id={`user-container-${trackID}`}
    >
      <div
        className={styles.streamContent}
        id={`user-${trackID}`}
      />
    </div>
  )
}

VideoPlayer.propTypes = {
  track: PropTypes.shape({
    type: PropTypes.string,
    trackSource: PropTypes.any,
    trackID: PropTypes.string,
  }),
}

export default VideoPlayer
