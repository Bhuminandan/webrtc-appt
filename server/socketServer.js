// For Socket io

// Module imports
const io = require('./server').io;
const app = require('./server').app;

const linkSecret = 'lsjdfkasjhdfklhaslkdfjhalskjh';
const jwt = require('jsonwebtoken');

// Varible to hold the data of the connected professionals
const connectedProffessionsals = [];

// Varible to hold the data of the connected clients
const connectedClients = [];

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
        const professionalAppointments = app.get('proffessionalsAppointments');

        // Emitting the appt data to the client, after filtering it with correct data
        socket.emit('apptData', professionalAppointments.filter(pa=> pa.professionalsFullName === fullName));

        // Loop through all known offers and send out to proffestions
        // the onces that belong to her or him
        for(const key in allKnownOffers) {
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

    socket.on('newOffer', ({offer, aaptInfo})=> {

        allKnownOffers[aaptInfo.uuid] = {
            ...aaptInfo,
            offer, 
            OfferIceCandidates: [],
            Answer: null,
            AnswerIceCandidates: [],
        };

        const professionalAppointments = app.get('proffessionalsAppointments');
        const pa = professionalAppointments.find(p => p.uuid == aaptInfo.uuid);

        if (pa) {
            pa.waiting = true;
        }



        const p = connectedProffessionsals.find((p) => {
            return p.fullName === aaptInfo.professionalsFullName
        });

        if (p) {
            const socketId = p.socketId;
            socket.to(socketId).emit('newOfferWaiting',allKnownOffers[aaptInfo.uuid])
            socket.to(socketId).emit('apptData',professionalAppointments.filter(pa=>pa.professionalsFullName === aaptInfo.professionalsFullName))
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