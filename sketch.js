
// control bools
let painting = false;
let hasCursed = false;
// vars used for drawing
let next =0;
let current;
let previous; 
let paths = [];
let StyleSelection
let htmlContext;


var fileIn = document.createElement('input');
fileIn.type = 'file';

function setup() {
  var mainCanvas = createCanvas(720, 500);
  var realCanvas = mainCanvas.canvas;
  htmlContext = realCanvas.getContext("2d");
  current = createVector(0,0);
  previous = createVector(0,0);
  savedSection = get(0,0,200,200);

  //create dropbox for selecting color pallete
  stySel = createSelect();
  stySel.position(50,500-10);
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
  background(255);
  fill(0);
  //draw the drawing input circle
  circle (100,100,200);
  text("Draw Here",70,210);
  text("Please re-upload the drawing after it is downloaded", 220,330);
  //draw the color input circle
  circle (100,500-100,200);
  drawForDrawings();
  downloadDraw.draw(); //draw the button
  clearDraw.draw(); //draw the other button
  //output cursed Drawing
  if(hasCursed){
    this.outImg = document.getElementById('stylized')
    htmlContext.drawImage(this.outImg,720-210,500/2-100);
  }
  //output StyleSelection image
  image(StyleSelection,0,500-200)
}

//create the button that downloads the file
downloadDraw = new Clickable();
downloadDraw.locate(720/2 - 65,500/2-52,2)
downloadDraw.resize(130,50);
downloadDraw.text = "Apply Colorization";
downloadDraw.onPress = function(){
  savedSection = get(0,0,200,200);
  savedSection.save("uncursedDrawing");
  fileIn.click();
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
  hasCursed =true;
  styleButton = document.getElementById("style-button");
  styleButton.click();
};

//create the button that clears the drawings
clearDraw = new Clickable();
clearDraw.locate(720/2 - 65,500/2 +2,2)
clearDraw.resize(130,50);
clearDraw.text = "Clear Drawings";
clearDraw.onPress = function(){
  paths = [];
}

function mousePressed() {
  //drawing stuff
  next = 0;
  //only start drawing if within the input area
  if(mouseX>10&&mouseX<210&&mouseY>10&&mouseY<210){
    painting = true;
  }
  previous.x = mouseX;
  previous.y = mouseY;
  paths.push(new Path());
}


function mouseReleased() {
  painting = false;//stop drawing
}


