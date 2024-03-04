import {peerConfiguration} from './stunServers'


// Function to create the peer connection
const createPeerConnection = (addIce) => {
    
    return new Promise(async (resolve, reject)=>{

        // Making the peer connection, by passing configuration
        // Which contains ice servers
        const peerConnection = new RTCPeerConnection(peerConfiguration);

        // Get the remote stream, for future use
        const remoteStream = new MediaStream();

        // Printing the signaling state chnage in console
        peerConnection.addEventListener('signalingstatechanged', (e)=>{
            console.log("Signaling state changed", e)
        });

        // Getting the ice candidates, and passing it to the addIce
        peerConnection.addEventListener('icecandidate',e=>{
            console.log("Found ice candidate...")
            if(e.candidate){
                addIce(e.candidate)
            }
        });

        // Adding tracks to the  remote stream
        peerConnection.addEventListener('track', e=>{
            console.log("Track added from remote");
            e.streams[0].getTracks().forEach(track=>{
                remoteStream.addTrack(track, remoteStream);
            })
        })

        // Resolving the promise with peer connection and remote stream
        resolve({peerConnection, remoteStream})
    })

};

export default createPeerConnection;