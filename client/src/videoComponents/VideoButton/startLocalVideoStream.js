// Function to update all peerConnections and update redux call

import updateCallStatus from "../../redux-elements/actions/updateCallStatus";

const startLocalVideoStream = (streams, dispatch)=>{
   const localStream = streams.localStream;

   for (const s in streams) {
    if(s !== 'localStream'){
        const curStream = streams[s];
        localStream.stream.getVideoTracks().forEach(track => 
            curStream.peerConnection.addTrack(track, streams.localStream.stream)
        )
    }

    dispatch(updateCallStatus('video', 'enabled'));

   }
}

export default startLocalVideoStream;