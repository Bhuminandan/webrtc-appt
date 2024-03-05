// For Socket io

// Module imports
const io = require('./server').io;
const app = require('./server').app;

const linkSecret = 'lsjdfkasjhdfklhaslkdfjhalskjh';
const jwt = require('jsonwebtoken');

// Varible to hold the data of the connected professionals
const connectedProffessionsals = [
    // socketId:,
    // fullName,
    // proId
];

// Varible to hold the data of the connected clients
const connectedClients = [
    // clientName,
    // uuid,
    // professionalMeetingWith,
    // socketId
];

// Varible to hold all the known offers
const allKnownOffers = {
    // Offer
    // ProffesionalsFullName
    // ClientName
    // ApptDate
    // OfferIceCandidates
    // Answer
    // AnswerIceCandidates
};


// Socket io connection
io.on('connection', (socket) => {

    // Getting the jwt token that we are sending from client side while 
    // connecting the socket
    const jwtToken = socket.handshake.auth.jwt;

    let decodedData;
    try {
        // Try to decode the jwt token
         decodedData = jwt.verify(jwtToken, linkSecret);
    } catch (error) {

        // If not valid, disconnect the socket
        console.log(error);
        socket.disconnect();
    }

    // Destructuring the decoded data
    const { fullName,  proId } = decodedData;

    // Only professionals have the prodId, so if it is not null
    // then it is a professional
    if (proId) {
        // Searching if the professional is already connected
        const connectedPro = connectedProffessionsals.find(p => p.proId === proId);

        // If yes, update the socket id
        if (connectedPro) {
            connectedPro.socketId = socket.id;
        } else {

            // If not, add it to the list
            connectedProffessionsals.push({
                socketId: socket.id,
                fullName,
                proId
            });
        }

        // Getting the array of proffesional appointments
        // Getting these hardcoded appointments from server.js file
        const professionalAppointments = app.get('proffessionalsAppointments');

        // Emitting the appt data to the client, after filtering it with correct data
        const apptData = professionalAppointments.filter(a => a.professionalsFullName === fullName);
        socket.emit('apptData', apptData);

        // Loop through all known offers and send out to proffestions
        // the onces that belong to her or him
        // Looping through allKnownOffers
        for(const key in allKnownOffers) {

            // If the proffesionals full name matches with the one in the offer
            // Then send that offer to the perticular proffesional
            // Or in other words emit that offer data to the perticular proffesional socket id
            if (allKnownOffers[key].proffessionalsFullName === fullName) {
                io.to(socket.id).emit('newOfferWaiting', allKnownOffers[key]);
            }
        }

    } else {

        // If it is a client
        // Destructuring the decoded data
        const { professionalsFullName, uuid, clientName } = decodedData;

        // Check if the client is already connected
        const clientExists = connectedClients.find(c => c.uuid == uuid);

        // If yes, update the socket id
        if (clientExists) {
            clientExists.socketId = socket.id;
        } else {
            // If not, add it to the list
            connectedClients.push({
                clientName,
                uuid,
                professionalMeetingWith: professionalsFullName,
                socketId: socket.id
            });
        }

        // Send the answer to the client
        const offerForThisClient = allKnownOffers[uuid];
        if(offerForThisClient) {
            io.to(socket.id).emit('answerToClient', offerForThisClient.Answer);
        }
        
    }

    // socket listener for new answer coming from the client
    socket.on('newAnswer', ({answer, uuid})=> {
    //  Emit this to the client
        const socketSendTo = connectedClients.find(c => c.uuid == uuid);

        if (socketSendTo) {
            socket.to(socketSendTo.socketId).emit('answerToClient', answer);
        }

        const knownOffer = allKnownOffers[uuid];
        if (knownOffer) {
            knownOffer.Answer = answer;
        }
    })

    // socket listener for new offer coming from the client
    socket.on('newOffer', ({offer, aaptInfo})=> {

        // aaptInfo will look like this
        // apptInfo = {
        //     professionalsFullName: "Peter Chan, J.D.",
        //     apptDate: Date.now() + 500000,
        //     uuid:1,
        //     clientName: "Jim Jones",
        // }

        // Updating the allKnownOffers with the apptInfo
        allKnownOffers[aaptInfo.uuid] = {
            ...aaptInfo,
            offer, 
            OfferIceCandidates: [],
            Answer: null,
            AnswerIceCandidates: [],
        };

        // Getting the professional appointments from the server file
        const professionalAppointments = app.get('proffessionalsAppointments');

        // Finding the proffessional appointment with the uuid in the apptInfo
        const pa = professionalAppointments.find(p => p.uuid == aaptInfo.uuid);

        // if yes, update the waiting status
        if (pa) {
            pa.waiting = true;
        }

        // Gathering the info of the proffesional, if they are connected
        const p = connectedProffessionsals.find((p) => {
            return p.fullName === aaptInfo.professionalsFullName
        });

        // Emitting the new offers to that proffesional
        if (p) {
            const socketId = p.socketId;

            // Emitting the new offer to the proffesional
            socket.to(socketId).emit('newOfferWaiting', allKnownOffers[aaptInfo.uuid]);

            // This line helps to again send the professional appointment data to the proffesional
            // Because we have just added the is waiting true to the proffesionalAppointments
            // So if we not send this data again it will not be visible to the client side
            const apptDataTosend = professionalAppointments.filter(pa=>pa.professionalsFullName === aaptInfo.professionalsFullName);
            socket.to(socketId).emit('apptData', apptDataTosend);
        }
    });

    socket.on('getIce', (uuid, who, ackFunc) => {

        console.log('========================All known offers', allKnownOffers[uuid]);
        const offer = allKnownOffers[uuid];        
        let iceCandidates = [];

        if (who === 'professional') {
            iceCandidates = offer.OfferIceCandidates;
        } else if (who === 'client') {
            iceCandidates = offer.AnswerIceCandidates;
        }

        ackFunc(iceCandidates);
    })

    socket.on('iceToServer', ({iceC, who, uuid}) => {

        const offerToUpdate = allKnownOffers[uuid];

        if (offerToUpdate) {
            if (who === 'client') {
                offerToUpdate.OfferIceCandidates.push(iceC);
                const socketToSendTo = connectedProffessionsals.find(c => c.fullName == decodedData.professionalsFullName);
                if (socketToSendTo) {
                    socket.to(socketToSendTo.socketId).emit('iceToClient', iceC);
                }
            } else if (who === 'professional') {
                offerToUpdate.AnswerIceCandidates.push(iceC);
                const socketToSendTo = connectedClients.find(c => c.uuid == uuid);
                if (socketToSendTo) {
                    socket.to(socketToSendTo.socketId).emit('iceToClient', iceC);
                }
            }
        }

    })
})