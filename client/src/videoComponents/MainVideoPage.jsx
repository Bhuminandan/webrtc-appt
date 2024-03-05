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
import clientSocketListeners from '../webRTCutilities/clientSocketListeners';

const MainVideoPage = () => {

  const dispatch = useDispatch();

  const [ searchParams, setSearchParams ] = useSearchParams();
  const [aaptInfo, setApptInfo] = useState({});
  const [showCallInfo, setShowCallInfo] = useState(true);

  const callStatus = useSelector(state=>state.callStatus);
  const streams = useSelector(state=>state.streams);

  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);
  const uuidRef = useRef(null);
  const streamsRef = useRef(null);


  // 1: Getting the user media and setting it up the peer connection
  useEffect(() => {

    // Fetch userMedia contraints (One of this shold be true, according to docs)
    const contraints = {
      video: true,
      audio: true
    }

    // Function to fetch user media or Ask for permission
    const fetchMedia = async () => {
      try {

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia(contraints);

        // Once we get the user media, we can set the haveMedia to true
        dispatch(updateCallStatus('haveMedia', true));
        // Dispatch action will send this stream to redux
        dispatch(addStream('localStream', stream));

        // Making the peer connection and getting the remote stream
        const { peerConnection, remoteStream } = await createPeerConnection(addIce);

        // Dispatch action will send this stream to redux with peer connection
        dispatch(addStream('remote1', remoteStream, peerConnection));

        // Set the large feed to the remote stream
        largeFeedEl.current.srcObject = remoteStream;

      } catch (error) {
        console.log(error);
      }
    }

    // Call function to Fetch user media
    fetchMedia();

  }, []);

  useEffect(()=>{
    if (streams.remote1) {
      streamsRef.current = streams;
    }
  }, [streams]);


  // UseEffect to create an offer
  // This will only happen if we have audio and video
  useEffect(()=>{
    const createOfferAsync = async () => {
        //we have audio and video and we need an offer. Let's make it!
        // Loop through all streams
        for(const s in streams) {

          // if it's not the local stream
          // This is why generally in webrtc we call createOffer() only for the remote stream
          // Obioulsy because that streams will have the peerconnections
            if(s !== "localStream"){
                try{
                    const pc = streams[s].peerConnection;
                    const offer = await pc.createOffer()
                    pc.setLocalDescription(offer);
                    //get the token from the url for the socket connection
                    const token = searchParams.get('token');
                    //get the socket from socketConnection
                    const socket = socketConnection(token);

                    // Emit the offer to the signaling server
                    socket.emit('newOffer',{offer, aaptInfo})

                }catch(err){
                    console.log(err);
                }
            }
        }
        // We have created an offer, and need to update the haveCreatedOffer
        // So this useEffect should not run again
        dispatch(updateCallStatus('haveCreatedOffer', true));
    }

    // Check if we have audio and video and we haven't created an offer yet
    if(callStatus.audio === "enabled" && callStatus.video === "enabled" && !callStatus.haveCreatedOffer){
        createOfferAsync();
    }

}, [callStatus.audio, callStatus.video, callStatus.haveCreatedOffer]);
  


// UseEffect to add the answer to the remote description
  useEffect(()=>{

    const asyncAddAnswer = async()=>{
        for(const s in streams) {
          if(s !== "localStream"){
            const pc = streams[s].peerConnection;
            pc.setRemoteDescription(callStatus.answer);
            console.log(pc.signalingState);
            console.log("Answer added!");
          }
      }
    }

    if(callStatus.answer){
        asyncAddAnswer();
    }

  }, [callStatus.answer]);


  // Useeffect to get the apptInfo from the server
  useEffect(() => {
    const token = searchParams.get('token');
    const fetchDecodedToken = async (token) => {
      const response = await axios.post('https://localhost:9000/validate-link', {
        token
      });

      // Setting the apptInfo
      setApptInfo(response.data.apptData);
      uuidRef.current = response.data.apptData.uuid
    }
    
    fetchDecodedToken(token) 
    
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    const socket = socketConnection(token);

    clientSocketListeners(socket, dispatch,addIceCandidateToPc);

  }, [])

  const addIceCandidateToPc = (iceC) => {
    for(const s in streamsRef.current) {
      if(s !== "localStream"){
        const pc = streamsRef.current[s].peerConnection;
        pc.addIceCandidate(iceC);
        setShowCallInfo(false);
      }
    }
  }

  const addIce = (iceC) => {

    const socket = socketConnection(searchParams.get('token'));
    socket.emit('iceToServer', {
      iceC,
      who: 'client',
      uuid: uuidRef.current
    });
  }

  return (
    <div>
      <div className="main-video-page">
        <div className='video-chat-wrapper'>
          {/* Dive to hold out main, chat and video */}
          <video id='large-feed' ref={largeFeedEl} autoPlay controls playsInline />
          <video id='own-feed' ref={smallFeedEl} autoPlay controls playsInline />

          {
            showCallInfo && <CallInfo apptInfo={aaptInfo} />
          }
          <ChatWindow/>
        </div>
          <ActionButtons 
            smallFeedEl={smallFeedEl}
            largeFeedEl={largeFeedEl}
          />
      </div>
    </div>
  )
}

export default MainVideoPage