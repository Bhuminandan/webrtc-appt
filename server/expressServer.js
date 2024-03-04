// For express server

const app = require("./server").app;
const jwt = require('jsonwebtoken');
const linkSecret = 'lsjdfkasjhdfklhaslkdfjhalskjh';
const { v4: uuidv4 } = require('uuid');

// Dummy data for testing purpose
const professionalAppointments = [{
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() + 500000,
    uuid:1,
    clientName: "Jim Jones",
},{
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() - 2000000,
    uuid:2,// uuid:uuidv4(),
    clientName: "Akash Patel",
},{
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() + 10000000,
    uuid:3,//uuid:uuidv4(),
    clientName: "Mike Williams",
}];

// Setting dummy data to global variable inside app
app.set('proffessionalsAppointments', professionalAppointments);

// Express route to get the link to join the meeting
app.get('/user-link', (req, res) => {

    // Hardcoding the value for of first appt
    const apptData = professionalAppointments[0];

    professionalAppointments.push(apptData);

    // Generating token to be used for joining
    const token = jwt.sign(apptData, linkSecret);
    res.send(`https://localhost:3000/join-video?token=${token}`);

});


// Express route to validate the token and send the decoded data to the client
app.post('/validate-link', async (req, res) => {
    
    // Getting the token fromm the request
    const token = req.body.token;

    // Validation
    if(!token) {
        return res.send({
            status: 'error',
            message: 'No token provided'
        });
    }

    // Decoding the token
    const apptData = await jwt.verify(token, linkSecret);

    // Sending the decoded data
    return res.send({
        status: 'success',
        apptData
    });
})


// Express route to get the link to login in dashboard for the professional
app.get('/pro-link', (req, res) => {

    // Hardcoded professional name
    const userData = {
        fullName: "Peter Chan, J.D.",
        proId: 12345,
    }

    // Generating token to be used for joining
    const token = jwt.sign(userData, linkSecret);
    // Giving back the link to the professional that redirects to dashboard
    res.send(`<a href="https://localhost:3000/dashboard?token=${token}" target="_blank">Go to dashboard    </a>`);
})