
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
      // User chnaged video device
      const deviceId = e.target.value;


      const newContraints = {
        audio: callStatus.audioDevice === 'default' ? true : {
          deviceId: {
            exact: callStatus.audioDevice
          }
        },
        video: {
          deviceId: {
            exact: deviceId
          }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(newContraints);

      dispatch(updateCallStatus('videoDevice', deviceId));
      dispatch(updateCallStatus('video', 'enabled'));

      smallFeedEl.current.srcObject = stream;

      dispatch(addStream('localStream', stream));

      const tracks  = stream.getVideoTracks();

    }

    const startStopVideo = ()=>{

      if (callStatus.video === 'enabled' ) {
        dispatch(updateCallStatus('video', 'disabled'));
        const tracks = smallFeedEl.current.srcObject.getVideoTracks();
        tracks.forEach(track => track.enabled = false);
      } else if(callStatus.video === 'disabled'){ 
        dispatch(updateCallStatus('video', 'enabled'));
        const tracks = smallFeedEl.current.srcObject.getVideoTracks();
        tracks.forEach(track => track.enabled = true);
      } else if(callStatus.haveMedia) {
        smallFeedEl.current.srcObject = streams.localStream.stream;
        startLocalVideoStream(streams, dispatch)
      } else {
        setPendingUpdate(true);
      }
    }

    useEffect(()=>{
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

