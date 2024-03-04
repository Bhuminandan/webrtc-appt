export default (who, stream, peerConnection)=>{
    return {
        type: "ADD_STREAM",
        payload: {
            who,
            stream,
            peerConnection 
        }
    }
}