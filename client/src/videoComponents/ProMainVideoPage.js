import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VideoComponents.css'
import CallInfo from './CallInfo';
import ChatWindow from './ChatWindow';
import ActionButtons from './ActionButtons';
import addStream from '../redux-elements/actions/addStream';
import { useDispatch, useSelector } from 'react-redux';
import createPeerConnection from '../webRTCutilities/createPeerConnection';
import socketConnection from '../webRTCutilities/socketConnection';
import updateCallStatus from '../redux-elements/actions/updateCallStatus';
import proSocketListeners from '../webRTCutilities/proSocketListeners';

const ProMainVideoPage = () => {

  const dispatch = useDispatch();

  const [ searchParams, setSearchParams ] = useSearchParams();
  const [aaptInfo, setApptInfo] = useState({});

  const callStatus = useSelector(state=>state.callStatus);
  const streams = useSelector(state=>state.streams);

  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);
  const streamsRef = useRef(null);
  const [haveGottenIce, setHaveGottenIce] = useState(false);


  useEffect(() => {
    // Fetch userMedia
    const contraints = {
      video: true,
      audio: true
    }
    const fetchMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(contraints);
        dispatch(updateCallStatus('haveMedia', true));
        // Dispatch action will send this stream to redux
        dispatch(addStream('localStream', stream));
        const { peerConnection, remoteStream } = await createPeerConnection(addIce);
        dispatch(addStream('remote1', remoteStream, peerConnection));
        largeFeedEl.current.srcObject = remoteStream;
      } catch (error) {
        console.log(error);
      }
    }
    fetchMedia();

  }, []);


  useEffect(()=>{

    const getIceAsync = async()=>{
          const socket = socketConnection(searchParams.get('token'));
          const uuid = searchParams.get('uuid');
          const iceCandidates = await socket.emitWithAck('getIce', uuid, 'professional');

          console.log('========================Received ICE', iceCandidates);

          iceCandidates.forEach(iceC=>{
            for(const s in streams){
              if(s !== "localStream"){
                const pc = streams[s].peerConnection;
                pc.addIceCandidate(iceC);
                console.log("Added ice candidate", iceC);
              }
            }
          })
    }
    if (streams.remote1 && !haveGottenIce) {
      setHaveGottenIce(true);
      getIceAsync();
      streamsRef.current = streams;
    }
  },[streams, haveGottenIce]);


    useEffect(()=>{
    const createAnswerAsync = async()=>{
        //we have audio and video, we can make an answer and setLocalDescription
        for(const s in streams){
            if(s !== "localStream"){
                const pc = streams[s].peerConnection;
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log("Answer created!", answer);

                dispatch(updateCallStatus('haveCreatedAnswer', true));
                dispatch(updateCallStatus('answer', answer));

                const token = searchParams.get('token');
                const socket = socketConnection(token);
                const uuid = searchParams.get('uuid');
                socket.emit('newAnswer', {answer, uuid});

            }
        }
    }
    //we only create an answer if audio and video are enabled AND haveCreatedAnswer is false
    //this may run many times, but these 3 events will only happen one
    if(callStatus.audio === "enabled" && callStatus.video === "enabled" && !callStatus.haveCreatedAnswer){
        createAnswerAsync()
    }
    },[callStatus.audio, callStatus.video, callStatus.haveCreatedAnswer]);


  useEffect(()=>{
    const asyncAddAnswer = async()=>{
        //listen for changes to callStatus.answer
        //if it exists, we have an answer!
        for(const s in streams){
            if(s !== "localStream"){
                const pc = streams[s].peerConnection;
                await pc.setRemoteDescription(callStatus.offer);
                console.log(pc.signalingState)
                console.log("Answer added!")
            }
        }
    }

    if (callStatus.offer && streams.remote1 && streams.remote1.peerConnection) {
      asyncAddAnswer()
    }

  },[callStatus.offer, streams.remote1]);

  
  useEffect(() => {
    const token = searchParams.get('token');
    const fetchDecodedToken = async (token) => {
      const response = await axios.post('https://localhost:9000/validate-link', {
        token
      });
      setApptInfo(response.data.apptData)
      
    }
    
    fetchDecodedToken(token) 
    
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const socket = socketConnection(token);

    proSocketListeners.proVideoSocketListeners(socket, addIceCandidateToPc);

  }, [])

  const addIceCandidateToPc = (iceC) => {
    for(const s in streamsRef.current) {
      if(s !== "localStream"){
        const pc = streamsRef.current[s].peerConnection;
        pc.addIceCandidate(iceC);
        console.log("Added ice candidate to existing page", iceC);
      }
    }
  }

  const addIce = (iceC) => {

    const socket = socketConnection(searchParams.get('token'));
    socket.emit('iceToServer', {
      iceC,
      who: 'professional',
      uuid: searchParams.get('uuid')
    });
  }

  return (
    <div>
      <div className="main-video-page">
        <div className='video-chat-wrapper'>
          {/* Dive to hold out main, chat and video */}
          <video id='large-feed' ref={largeFeedEl} autoPlay controls playsInline />
          <video id='own-feed' ref={smallFeedEl} autoPlay controls playsInline />
          { callStatus.audio === "off" || callStatus.video === "off" ?
                <div className="call-info">
                    <h1>
                        {searchParams.get('client')} is in the waiting<br />
                        Call will start when video and audio is enabled
                    </h1>
                </div>
                : <></>
          }
          <ChatWindow/>
        </div>
          <ActionButtons smallFeedEl={smallFeedEl}/>
      </div>
    </div>
  )
}

export default ProMainVideoPage;