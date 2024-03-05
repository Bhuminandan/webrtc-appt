// Function to update all peerConnections 

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