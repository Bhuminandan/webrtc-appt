import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import ActionButtonCaretDropdown from '../ActionButtonCaretDropdown';
import { getDevices } from '../../webRTCutilities/getDevices';
import updateCallStatus from '../../redux-elements/actions/updateCallStatus';
import addStream from '../../redux-elements/actions/addStream';
import startAudioStream from './StartAudioStream';

const AudioButton = ({ smallFeedEl }) => {


    const callStatus = useSelector(state=>state.callStatus);
    const streams = useSelector(state=>state.streams);

    
    const [caretOpen, setCaretOpen] = useState(false);
    const [audioDevices, setAudioDevices] = useState([]);

    const dispatch = useDispatch();
    

    // Set the text for the audio button according to the state
    let micText;
    if(callStatus.audio === "off"){
        micText = "Join Audio"
    }else if(callStatus.audio === "enabled"){
        micText = "Mute"
    }else{
        micText = "Unmute"
    }

    
    const startStopAudio = ()=>{

      if (callStatus.audio === 'enabled' ) {
          // If the audio is enabled, we need to disable it
            dispatch(updateCallStatus('audio', 'disabled'));

            // Mute the audio, instead of disconnecting,
            // For that get the tracts from the srcObject and set them to false
            const tracks = smallFeedEl.current.srcObject.getAudioTracks();
            tracks.forEach(track => track.enabled = false);
          } else if(callStatus.audio === 'disabled') { 

            // If the audio is disabled, we need to enable it
            dispatch(updateCallStatus('audio', 'enabled'));

            // Unmute the audio
            // For that get the tracts from the srcObject and set them to true
            const tracks = smallFeedEl.current.srcObject.getAudioTracks();
            tracks.forEach(track => track.enabled = true);

          } else {
            // Here chnage audio device works as a starting for the audio stream
            changeAudioDevice({
              target: {
                value: 'input-default'
              }
            });
            startAudioStream(streams);
          }
    }

    const changeAudioDevice = async (e)=>{

        // Our value looks like input-<deviceId>
        // So we need to split it
        const deviceId = e.target.value.split('-')[1]; // this will give us the deviceId
        const audioType = e.target.value.split('-')[0]; // this will give us the audioType (input or output)

        // If the audioType is output, we need to set the sinkId
        // sinkId is used to set the audio output device
        // and for outpur we dont need to explicitly create the new stream
        if (audioType === 'output' ) {
          // we need to set the sinkId
            smallFeedEl.current.setSinkId(deviceId);
        } else if (audioType === 'input') {

          // If its the input, we need to create a new stream

          // Creating the new contraints
            const newContraints = {
              // Setting the audio device to the new deviceId
                audio: {
                    deviceId: {
                      ideal: deviceId
                    }
                },
                // if the video device was default, we need to set it to true
                // otherwise we need to set it to existing device id from redux state
                video:  callStatus.videoDevice === 'default' ? true : {
                    deviceId: {
                      exact: callStatus.videoDevice
                    }
                  }
        
            }

            // Creating the new stream with new contraints
            const stream = await navigator.mediaDevices.getUserMedia(newContraints);

            // Setting new audio device
            dispatch(updateCallStatus('audioDevice', deviceId));
            // Setting the audio to enabled
            dispatch(updateCallStatus('audio', 'enabled'));
            // Setting the new stream
            dispatch(addStream('localStream', stream));

            // Getting the tracks from the new stream
            const [audioTracks] = stream.getAudioTracks();

            for(const s in streams) {
              if(s !== 'localStream') {
                // Get senders will grab all the rtpSenders from the peer connection has
                const senders = streams[s].peerConnection.getSenders();
      
                // Find the sender that has the video track
                // Basically we are finding the sender which is incharge of video tracks
                const sender = senders.find((sender) => {
                  if (sender.track) {
                    // If this track is the video track then return true
                    return sender.track.kind === audioTracks.kind;
                  } else {
                    return false;
                  }
                });
                // Sender is RTPSender so it has replaceTrack method
                sender.replaceTrack(audioTracks);
              }
            }
        }
    }

    // Function to fetch audio devices
    useEffect(()=>{
      
        const fetchAudioDevices = async()=>{
          if (caretOpen) {
            const devices = await getDevices();
            setAudioDevices(devices.audioOutputDevices.concat(devices.audioInputDevices));
          }
        }
        fetchAudioDevices();
  
      }, [caretOpen])


  return (
    <div className="button-wrapper d-inline-block">
        <i className="fa fa-caret-up choose-audio" onClick={() => setCaretOpen(!caretOpen)}></i>
        <div className="button mic" onClick={startStopAudio}>
            <i className="fa fa-microphone"></i>
            <div className="btn-text">{micText}</div>
        </div>
        {
          caretOpen ? <ActionButtonCaretDropdown 
                        defaultValue={callStatus.audioDevice} 
                        changeHandler={changeAudioDevice} 
                        deviceList={audioDevices}
                        type="audio"
                      /> 
                : 
                null
        }
    </div>
  )
}

export default AudioButton;