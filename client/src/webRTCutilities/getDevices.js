

export const getDevices = () => {
    return new Promise(async(resolve, reject) => {

        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter devices based on kind
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');

        // Validation check
        if (!videoDevices.length || !audioInputDevices.length || !audioOutputDevices.length) {
            reject('No devices found');
        }

        // Resolve with the devices
        resolve({videoDevices, audioInputDevices, audioOutputDevices})
    })
}