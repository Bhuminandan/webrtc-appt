import updateCallStatus from "../redux-elements/actions/updateCallStatus"

const proDashboardSocketListeners = (socket, setApptInfo, dispatch) => {
    socket.on('apptData', (apptData) => {
        setApptInfo(apptData);
    });

    socket.on('newOfferWaiting', (offerData) => {

        console.log(offerData);

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