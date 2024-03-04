

export const getDevices = () => {
    return new Promise(async(resolve, reject) => {
        const devices = await navigator.mediaDevices.enumerateDevices();

        console.log(devices);

        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');

        if (!videoDevices.length || !audioInputDevices.length || !audioOutputDevices.length) {
            reject('No devices found');
        }

        // console.log({videoDevices, audioInputDevices, audioOutputDevices});

        resolve({videoDevices, audioInputDevices, audioOutputDevices})
    })
}