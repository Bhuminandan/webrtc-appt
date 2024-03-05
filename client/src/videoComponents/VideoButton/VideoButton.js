
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import startLocalVideoStream from './startLocalVideoStream';
import updateCallStatus from '../../redux-elements/actions/updateCallStatus';
import { getDevices } from '../../webRTCutilities/getDevices';
import addStream from '../../redux-elements/actions/addStream';
import ActionButtonCaretDropdown from '../ActionButtonCaretDropdown';

const VideoButton = ({smallFeedEl}) => {

    const dispatch = useDispatch();

    const [pendingUpdate, setPendingUpdate] = useState(false);
    const [caretOpen, setCaretOpen] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);

    const callStatus = useSelector(state=>state.callStatus);
    const streams = useSelector(state=>state.streams);


    // UseEffect to fetch video devices, whenevr the caret opens
    useEffect(()=>{
      
      const fetchVideoDevices = async()=>{
        if (caretOpen) {
          const devices = await getDevices();
          setVideoDevices(devices.videoDevices);
        }
      }
      fetchVideoDevices();

    }, [caretOpen])

    const chnageVideoDevice = async (e)=>{

      // Getting the device id of the changed device
      const deviceId = e.target.value;

      // Making the new constraints
      const newContraints = {

        // Checking if the audioDevice is default, if not then setting it to the callStatus.audioDevice
        audio: callStatus.audioDevice === 'default' ? true : {
          deviceId: {
            exact: callStatus.audioDevice
          }
        },
        // Setting video device to new deviceId
        video: {
          deviceId: {
            exact: deviceId
          }
        }
      }

      // Getting new stream with the new contraints
      const stream = await navigator.mediaDevices.getUserMedia(newContraints);

      // Update the redux
      dispatch(updateCallStatus('videoDevice', deviceId));
      dispatch(updateCallStatus('video', 'enabled'));

      // Setting the video element to the new stream
      smallFeedEl.current.srcObject = stream;

      // updating the local stream
      dispatch(addStream('localStream', stream));

      // Getting the tracks from new stream
      const [videoTracks]  = stream.getVideoTracks();

      for(const s in streams) {
        if(s !== 'localStream') {
          // Get senders will grab all the rtpSenders from the peer connection has
          const senders = streams[s].peerConnection.getSenders();

          // Find the sender that has the video track
          // Basically we are finding the sender which is incharge of video tracks
          const sender = senders.find((sender) => {
            if (sender.track) {
              // If this track is the video track then return true
              return sender.track.kind === videoTracks.kind;
            } else {
              return false;
            }
          });
          // Sender is RTPSender so it has replaceTrack method
          sender.replaceTrack(videoTracks);
        }
      }

    }

    // Function to start/stop video
    const startStopVideo = ()=>{

      // If the video is enabled, we need to disable it
      if (callStatus.video === 'enabled' ) {

        // Update the redux
        dispatch(updateCallStatus('video', 'disabled'));
        
        // Mute the video, instead of disconnecing the whole connection
        const tracks = smallFeedEl.current.srcObject.getVideoTracks();
        tracks.forEach(track => track.enabled = false);

      } else if(callStatus.video === 'disabled'){ 
        // If the video is disabled, we need to enable it, by enabling the tracks
        // Update the redux
        dispatch(updateCallStatus('video', 'enabled'));
        // Unmute the video
        const tracks = smallFeedEl.current.srcObject.getVideoTracks();
        tracks.forEach(track => track.enabled = true);
      } else if(callStatus.haveMedia) {

        // If we already have media, we need to start the video
        smallFeedEl.current.srcObject = streams.localStream.stream;

        startLocalVideoStream(streams, dispatch)
      } else {

        // If we don't have media, we need to wait for it
        setPendingUpdate(true);
      }
    }

    useEffect(()=>{

      // This useEffect will run once the haveMedia gets updates
      // Have media actually gets updated
      // fetchMedia function in MainVideoPage.jsx
        if(pendingUpdate && callStatus.haveMedia){
            setPendingUpdate(false);
            smallFeedEl.current.srcObject = streams.localStream.stream;
            startLocalVideoStream(streams, dispatch)
        }
    }, [pendingUpdate, callStatus.haveMedia])

  return (
    <div className="button-wrapper video-button d-inline-block">
        <i className="fa fa-caret-up choose-video" onClick={() => setCaretOpen(!caretOpen)}></i>
        <div className="button camera" onClick={startStopVideo}>
            <i className="fa fa-video"></i>
            <div className="btn-text">{callStatus.video === "enabled" ? "Stop" : "Start"} Video</div>
        </div>
        {
          caretOpen ? <ActionButtonCaretDropdown 
                           defaultValue={callStatus.videoDevice} 
                           changeHandler={chnageVideoDevice} 
                           deviceList={videoDevices}
                           type="video"
                      /> : 
                      null
        }
    </div>
  )
}

export default VideoButton

