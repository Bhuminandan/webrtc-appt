// Function to update all peerConnections and update redux call

import updateCallStatus from "../../redux-elements/actions/updateCallStatus";

const startLocalVideoStream = (streams, dispatch)=>{

    // Get the local stream
   const localStream = streams.localStream;

    // Loop through all streams and add tracks to peerConnection exept localStream
   for (const s in streams) {
    if(s !== 'localStream'){
        const curStream = streams[s];
        localStream.stream.getVideoTracks().forEach(track => 
            curStream.peerConnection.addTrack(track, streams.localStream.stream)
        )
    }

    // Update the redux with video enabled
    dispatch(updateCallStatus('video', 'enabled'));

   }
}

export default startLocalVideoStream;