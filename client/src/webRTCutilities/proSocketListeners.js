import updateCallStatus from "../redux-elements/actions/updateCallStatus"

const proDashboardSocketListeners = (socket, setApptInfo, dispatch) => {

    // This apptData is for prodashboard, this will come from server 
    // For the perticular professional
    socket.on('apptData', (apptData) => {

        console.log(apptData);
        setApptInfo(apptData);
    });

    // This receives the offer for the proffesional
    socket.on('newOfferWaiting', (offerData) => {
        // Adding / Updating the offer inside the store
        dispatch(updateCallStatus('offer', offerData.offer));
        dispatch(updateCallStatus('myRole', 'answerer'));
    })
};

const proVideoSocketListeners = (socket, addIceCandidateToPc) => {
    socket.on('iceToClient', (iceC) => {
        addIceCandidateToPc(iceC);
    })
}

export default {proDashboardSocketListeners, proVideoSocketListeners};