// Function to update all peerConnections and update redux call

import updateCallStatus from "../../redux-elements/actions/updateCallStatus";

const startAudioStream = (streams)=>{

   const localStream = streams.localStream;

   for (const s in streams) {
    if(s !== 'localStream'){
        const curStream = streams[s];
        localStream.stream.getAudioTracks().forEach(track => 
            curStream.peerConnection.addTrack(track, streams.localStream.stream)
        )
    }

   }
}

export default startAudioStream;