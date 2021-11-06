
// control bools
let painting = false;
let hasCursed = false;
let isCursing = false;
let isMute = false;
// vars used for drawing
let next =0;
let current;
let previous; 
let paths = [];
let StyleSelection
let htmlContext;


var fileIn = document.createElement('input');
fileIn.type = 'file';

function preload(){
  bgm = loadSound('assets/PokemonOpening.mp3');
}

function setup() {
  var mainCanvas = createCanvas(1055, 550);
  var realCanvas = mainCanvas.canvas;
  htmlContext = realCanvas.getContext("2d");
  current = createVector(0,0);
  previous = createVector(0,0);
  savedSection = get(0,0,200,200);
  this.cusedImg;
  this.ogFrames;
  this.bsX = 20
  this.bsY = 200

  //create dropbox for selecting color pallete
  stySel = createSelect();
  stySel.position(this.bsX +180+55,this.bsY + 315);
  stySel.option('Pikachu');
  stySel.option('Charizard');
  stySel.option('Onix');
  stySel.option('Eevee');
  stySel.selected('Pikachu');
  stySel.changed(stySelChanged);
  PikaPalette = loadImage('assets/Pikachu.png');
  CharPalette = loadImage('assets/Charizard.png');
  OnixPalette = loadImage('assets/Onix.png');
  EeveePalette = loadImage('assets/Eevee.png');
  StyleSelection = PikaPalette;

  //other assets
  battleSwoosh = loadImage('assets/BattleSwoosh.png');
  logo = loadImage('assets/Logo.png');

  bgm.loop();
};


//implement the functionality of the dropdown here
function stySelChanged() {
  let styleimage = document.getElementById("style-img");
  if(stySel.value() === "Pikachu"){
    StyleSelection = PikaPalette;
    styleimage.src = "assets/Pikachu.png";
  }
  else if(stySel.value() === "Charizard"){
    StyleSelection = CharPalette;
    styleimage.src = "assets/Charizard.png";
  }
  else if(stySel.value() === "Onix"){
    StyleSelection = OnixPalette;
    styleimage.src = "assets/Onix.png";
  }
  else if(stySel.value() === "Eevee"){
    StyleSelection = EeveePalette;
    styleimage.src = "assets/Eevee.png";
  }

}

function draw() {

  //draw canvas w/ cursed image behind background, and grab a screenshot so it can be deformed back to round
  if(isCursing){
    if(frameCount === ogFrames){
      hasCursed = true;
      this.outImg = document.getElementById('stylized')
      htmlContext.drawImage(this.outImg,0,0);
      this.cursedImg = get(0,0,200,260);
      this.cursedImg.resize(200,200);
      isCursing = false;
    }
  }

  background(255);
  image(battleSwoosh,bsX,bsY);
  image(logo,80,30);

  //output cursed Drawing
  if(hasCursed){
    image(this.cursedImg,bsX+740,bsY+50);
  }
  //output StyleSelection image
  image(StyleSelection,bsX+180,bsY+ 50);
  fill(0);
  text("Draw Here",bsX+460+70,bsY+280);
  text("Select Pokemon",bsX+180+55,bsY+280);
  text("Please re-upload the drawing after it is downloaded", bsX+700,bsY+280);
  text("The AI takes some time to think, please be patient", bsX+700,bsY+293);
  drawForDrawings();
  downloadDraw.draw(); //draw the button
  clearDraw.draw(); //draw the other button
  muteBtn.draw();

  // if(!bgm.isPlaying()){
  //   bgm.play();
  // }

}

//create the button that downloads the file
muteBtn = new Clickable();
muteBtn.locate(1030-50+20,150,2);
muteBtn.resize(50,48);
muteBtn.text = "Mute";
muteBtn.onPress = function(){
  if(isMute){
    isMute = false;
    bgm.setVolume(1.0);
    console.log("ping");
  }
  else{
    isMute = true;
    bgm.setVolume(0.0);
  }
}

//create the button that downloads the file
downloadDraw = new Clickable();
downloadDraw.locate(740+40+20,200+300+1,2);
downloadDraw.resize(120,48);
downloadDraw.text = "Apply Colorization";
downloadDraw.onPress = function(){
  savedSection = get(bsX+460,bsY+50,200,200);
  savedSection.save("uncursedDrawing");
  fileIn.click();
}

//create the button that clears the drawings
clearDraw = new Clickable();
clearDraw.locate(460+40+20,200+300+1,2)
clearDraw.resize(120,48);
clearDraw.text = "Clear Drawings";
clearDraw.onPress = function(){
  paths = [];
}

//Do the thing with the input from the user
fileIn.onchange = function (evt) {
  var f = evt.target.files[0];
  var fileReader = new FileReader();
  fileReader.onload = function (e) {
    var ContentImg = document.getElementById('content-img');
     ContentImg.src = e.target.result;
  };
  fileReader.readAsDataURL(f);
  fileIn.value = '';
  styleButton = document.getElementById("style-button");
  styleButton.click();
  isCursing = true;
  ogFrames = frameCount +10;
};

function mousePressed() {
  //drawing stuff
  next = 0;
  //only start drawing if within the input area
  if(mouseX>bsX+460&&mouseX<bsX+660&&mouseY>bsY+50&&mouseY<bsY+250){
    painting = true;
  }
  previous.x = mouseX;
  previous.y = mouseY;
  paths.push(new Path());
}


function mouseReleased() {
  painting = false;//stop drawing
}


