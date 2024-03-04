const ActionButtonCaretDropdown = ({ defaultValue, changeHandler, deviceList, type }) => {

  let dropDownEl;

  if (type === 'video') {
    dropDownEl =deviceList.map((device, index) => <option key={index} value={device.deviceId}>{device.label}</option>)
  } else if (type === 'audio') {
    const audioInputEl = [];
    const audioOutputEl = [];

    console.log(deviceList)

    deviceList.forEach((device, i) => {
      if (device.kind === 'audioinput') {
        audioInputEl.push(<option key={`input-${device.deviceId}`} value={`input-${device.deviceId}`}>{device.label}</option>)
      } else if (device.kind === 'audiooutput') {
        audioOutputEl.push(<option key={`output-${device.deviceId}`} value={`output-${device.deviceId}`}>{device.label}</option>)
      }
    })

    audioInputEl.unshift(<optgroup key={'input'} label="Audio Input"/>);
    audioOutputEl.unshift(<optgroup key={'output'} label="Audio Output"/>);

    dropDownEl = audioInputEl.concat(audioOutputEl);
  }


    return (
        <div className='caret-dropdown' style={{top: '-25px'}}>
         <select defaultValue={defaultValue} onChange={changeHandler}>
           {dropDownEl}
         </select>
        </div>
     )
};

export default ActionButtonCaretDropdown;