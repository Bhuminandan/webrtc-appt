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
            dispatch(updateCallStatus('audio', 'disabled'));
            const tracks = smallFeedEl.current.srcObject.getAudioTracks();
            tracks.forEach(track => track.enabled = false);
          } else if(callStatus.audio === 'disabled') { 
            dispatch(updateCallStatus('audio', 'enabled'));
            const tracks = smallFeedEl.current.srcObject.getAudioTracks();
            tracks.forEach(track => track.enabled = true);
          } else {
            changeAudioDevice({
              target: {
                value: 'input-default'
              }
            });
            startAudioStream(streams);
          }
    }

    const changeAudioDevice = async (e)=>{
        const deviceId = e.target.value.split('-')[1];
        const audioType = e.target.value.split('-')[0];

        if (audioType === 'output' ) {
            smallFeedEl.current.setSinkId(deviceId);
        } else if (audioType === 'input') {
            const newContraints = {
                audio: {
                    deviceId: {
                      exact: deviceId
                    }
                },
                video:  callStatus.audioDevice === 'default' ? true : {
                    deviceId: {
                      exact: callStatus.audioDevice
                    }
                  }
        
            }

            const stream = await navigator.mediaDevices.getUserMedia(newContraints);
            dispatch(updateCallStatus('audioDevice', deviceId));
            dispatch(updateCallStatus('audio', 'enabled'));
            dispatch(addStream('localStream', stream));

            const tracks = stream.getAudioTracks();
        }
    }

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