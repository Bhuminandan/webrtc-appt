import updateCallStatus from "../redux-elements/actions/updateCallStatus";

const clientSocketListeners = (socket, dispatch, addIceCandidateToPc) => {
    socket.on('answerToClient', (answer) => {
        dispatch(updateCallStatus('answer', answer));
        dispatch(updateCallStatus('myRole', 'offerer'));
    });

    socket.on('iceToClient', (iceC) => {
        addIceCandidateToPc(iceC);
    })
}

export default clientSocketListeners;