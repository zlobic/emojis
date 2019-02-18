import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import * as posenet from '@tensorflow-models/posenet';


class App extends Component {

  state = { // Initializing the state to keep track of the camera facingMode and notifications rendering.
    notification: '',
    facingMode: 'user'
  }

  // const positions = {
  //   eye:

  // }

  async componentDidMount(){                     // Async componentDidMount to make calls to Media Stream API and Posenet API
    var video = this.refs.Video;                // declaring video variable to pass on as HTMLMediaElement to inspect with PoseNet
    this.checkDevices();                       // Check available devices to see if user can use app.
    await this.getAccessToMediaStream();      // await Media Streams API, getting user cam stream. 
    const pose = await this.getPose(video);  //declaring a variable that is equal to the return value of Posenet bodypart determination in the getPose call. We will use pose for printing emojis as it contains the keypoints to the recognized body parts
    this.drawCanvas(pose.keypoints)
    this.changePerFrame();
  }

   changePerFrame(){
    var video = this.refs.Video;  
    const canvas = this.refs.canvas
    const ctx = canvas.getContext("2d")
           // declaring video variable to pass on as HTMLMediaElement to inspect with PoseNet
    setInterval(async ()=> {
      ctx.clearRect(0, 0, 800, 600)    
      const pose = await this.getPose(video); 
      this.drawCanvas(pose.keypoints)
    }, 500);
  }
  
  async drawCanvas(parts){
    var bodyParts = parts
    var imageElements = this.refs
    const canvas = this.refs.canvas
    const ctx = canvas.getContext("2d")
    bodyParts = bodyParts.filter(bodyPart => bodyPart.score > 0.80)
    bodyParts.forEach(bodyPart => {
      if (imageElements[bodyPart.part]){
        var imageElement = imageElements[bodyPart.part];
      }
      debugger
      var canvasImage = new Image();
      canvasImage.src = imageElement.src
      ctx.drawImage(canvasImage, bodyPart.position.x - 32, bodyPart.position.y - 32);
    })
  }

  async getPose(stream){
    const net = await posenet.load();
    const pose = await net.estimateSinglePose(stream, 0.4, false, 16);
    return pose;
  }

  async checkDevices (checkIfSwitch) {
    let devices = [];
    if (navigator.mediaDevices) { //check is user's device has camera/audio outputs
      devices =  await navigator.mediaDevices.enumerateDevices(); //if user has list them
      devices = devices.filter(device => device.kind === "videoinput") // and filter them on video
      if (devices.length === 1){
        console.log("Only one camera available: " + devices);
        this.setState({notification: "Your device has just one camera"});
        this.turnOffNotification();
      } else if (devices.length === 0) {
        console.log("There are no camera's avaialable");
        this.setState({notification: "Your device does not have any camera's"});
        this.turnOffNotification();
      } else {
        if (checkIfSwitch === "switch") return devices;
        console.log("These are the available camera's: " + devices);
      }
    } else {
      console.log("Your device does not support media devices");
      this.setState({notification: "Your device does not support media devices"});
    }
  }

  async getAccessToMediaStream() {
    const constraints = {                                                 //declaring the constraints for the getUserMedia API call in order to get Cam stream from the user
    video: {facingMode: this.state.facingMode},                          //facingMode in case the user has a fromt and rear camera. 
      audio: false                                                      // We don't need any audio stream from the user
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.oGetUserMedia || navigator.msGetUserMedia; // Checking for getUserMedia in different browsers
    
    if (navigator.getUserMedia){                                       // Checking if browser supports getUserMedia else no stream can be obtained
      await navigator.mediaDevices.getUserMedia(constraints)        // If it can be, we're getting the stream here with the above declared constraints. 
      .then((stream)=> {                                           // Given the constraints the getUserMedia will return by default a stream. 
        var video = this.refs.Video;                              //declaration of our <video> HTMLMediaElement variable. 
        video.srcObject = stream;                                // with create.URL.objectURL being deprecated we have to attach our MediaStream to the srcObject of our HTMLMediaElement to create a playable media source
        video.play();                                           //Play the stream
      })  
      .catch((err)=>{
        if (err) console.log("Permission to the camera device denied");
        this.setState({notification: "Don't forget to allow Emojinator to use your camera"});
        this.turnOffNotification();
      })
    } else {
      console.log("UserMedia not supported")
      this.setState({"noitification": "User media not supported"})
    }
  }
  
  switch = () => {                                                // a switch function to switch between camera view mode in case of front and rear camera
    this.checkDevices('switch')                                  //a call to checkDevices to see if a switch is appropriate in case the user has just one camera. Passing on "switch" to indicate a call from switch so devices get returned, else nothing gets returned so no obsolete handling of data.
    .then((result)=>{
      if (result.length >= 2){                                 // if user has more than 2 devices perform switch
        var video = this.refs.Video;                          //declare our video variable to stop the MediaTrack running on it later
        video.srcObject.getTracks().forEach(track => {
          track.stop();                                     //Stop all the MediaTracks by accessing their srcObject
        })
        this.state.facingMode === "user" ? this.setState({facingMode: "environment" }) : this.setState({facingMode: "user"});         //Switch the facingMode by updating the state so getAcessToMediaStream can render the correct view
        this.getAccessToMediaStream();                                                                                               //call to getAccessToMediaStream to get Media Stream access with new camera angle.
      }
    })
    .catch((err)=> console.log(err))
  }

  turnOffNotification = () => { // In order to let possible notifications disappear again this function is called in which the state of notificition is reset.
    setTimeout(()=> {
      this.setState({notification: ''})
    }, 2500);
  }

  render() {
    const {notification} = this.state
    return (
      <div className="App">
       <h1>Welcome to Emojinator <span id="hand"></span></h1>
       <h3>Move yourself in front of the camera and get transformed into emojis </h3>
       <h5 style={{fontWeight: '300'}}>{notification}</h5>
       <video ref="Video"  width="800px" height="600px"/>
       <canvas id="myCanvas" ref="canvas" width={800} height={600} style={{ border: '3px solid black'}} />
       <span> <i className="fas fa-camera control" onClick={this.switch}></i></span>
       <img style={{display: 'none'}} src="/images/eye.png" ref="leftEye" className="emoji"/>
       <img style={{display: 'none'}} src="/images/eye.png" ref="rightEye" className="emoji"/>
       <img style={{display: 'none'}} src="/images/nose.png" ref="nose" className="emoji"/>
       <img style={{display: 'none'}} src="/images/ear.png" ref="rightEar" className="emoji"/>
       <img style={{display: 'none'}} src="/images/ear.png" ref="leftEar" className="emoji"/>
       <img style={{display: 'none'}} src="/images/hand.png" ref="leftWrist" className="emoji"/>
       <img style={{display: 'none'}} src="/images/hand.png" ref="rightWrist" className="emoji"/>
       <img style={{display: 'none'}} src="/images/foot.png" ref="leftAnkle" className="emoji"/>
       <img style={{display: 'none'}} src="/images/foot.png" ref="rightAnkle" className="emoji"/>
      </div>
    );
  }
}

export default App;
