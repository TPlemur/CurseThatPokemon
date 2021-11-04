//import 'babel-polyfill';
//import * as tf from '@tensorflow/tfjs';
tf.ENV.set('WEBGL_PACK', false);  // This needs to be done otherwise things run very slow v1.0.4
//import links from './links';
//console.log(tf);

export default class AIS{
    constructor() {

        this.fileSelect = document.getElementById('file-select');
    
        this.initalizeWebcamVariables();
        this.initializeStyleTransfer();
    
        Promise.all([
          this.loadMobileNetStyleModel(),
          this.loadSeparableTransformerModel(),
        ]).then(([styleNet, transformNet]) => {
          console.log('Loaded styleNet');
          this.styleNet = styleNet;
          this.transformNet = transformNet;
          this.enableStylizeButtons()
        });
      }
    
      async loadMobileNetStyleModel() {
        if (!this.mobileStyleNet) {
          this.mobileStyleNet = await tf.loadGraphModel(
            'saved_model_style_js/model.json');
        }
    
        return this.mobileStyleNet;
      }
    
      async loadInceptionStyleModel() {
        if (!this.inceptionStyleNet) {
          this.inceptionStyleNet = await tf.loadGraphModel(
            'saved_model_style_inception_js/model.json');
        }
        
        return this.inceptionStyleNet;
      }
    
      async loadOriginalTransformerModel() {
        if (!this.originalTransformNet) {
          this.originalTransformNet = await tf.loadGraphModel(
            'saved_model_transformer_js/model.json'
          );
        }
    
        return this.originalTransformNet;
      }
    
      async loadSeparableTransformerModel() {
        if (!this.separableTransformNet) {
          this.separableTransformNet = await tf.loadGraphModel(
            'saved_model_transformer_separable_js/model.json'
          );
        }
    
        return this.separableTransformNet;
      }
    
      initalizeWebcamVariables() {
        this.camModal = $('#cam-modal');
    
        this.snapButton = document.getElementById('snap-button');
        this.webcamVideoElement = document.getElementById('webcam-video');
    
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
    
        this.camModal.on('hidden.bs.modal', () => {
          this.stream.getTracks()[0].stop();
        })
    
        this.camModal.on('shown.bs.modal', () => {
          navigator.getUserMedia(
            {
              video: true
            },
            (stream) => {
              this.stream = stream;
              this.webcamVideoElement.srcObject = stream;
              this.webcamVideoElement.play();
            },
            (err) => {
              console.error(err);
            }
          );
        })
      }
    
      openModal(element) {
        this.camModal.modal('show');
        this.snapButton.onclick = () => {
          const hiddenCanvas = document.getElementById('hidden-canvas');
          const hiddenContext = hiddenCanvas.getContext('2d');
          hiddenCanvas.width = this.webcamVideoElement.width;
          hiddenCanvas.height = this.webcamVideoElement.height;
          hiddenContext.drawImage(this.webcamVideoElement, 0, 0, 
            hiddenCanvas.width, hiddenCanvas.height);
          const imageDataURL = hiddenCanvas.toDataURL('image/jpg');
          element.src = imageDataURL;
          this.camModal.modal('hide');
        };
      }
    
      initializeStyleTransfer() {
        // Initialize images
        this.contentImg = document.getElementById('content-img');
        this.contentImg.onerror = () => {
          alert("Error loading " + this.contentImg.src + ".");
        }
        this.styleImg = document.getElementById('style-img');
        this.styleImg.onerror = () => {
          alert("Error loading " + this.styleImg.src + ".");
        }
        this.stylized = document.getElementById('stylized');
    
        // Initialize images
        this.contentImgSlider = document.getElementById('content-img-size');
        this.connectImageAndSizeSlider(this.contentImg, this.contentImgSlider);
        this.styleImgSlider = document.getElementById('style-img-size');
        this.styleImgSquare = document.getElementById('style-img-square');
        this.connectImageAndSizeSlider(this.styleImg, this.styleImgSlider, this.styleImgSquare);
        
        this.styleRatio = 1.0
    
    
        //PING
        //this is what the stylize button calls
        // Initialize buttons
        this.styleButton = document.getElementById('style-button');
        this.styleButton.onclick = () => {
          console.log("starting style Transfer");
          this.disableStylizeButtons();
          this.startStyling().finally(() => {
            this.enableStylizeButtons();
          });
        };
    
    
        // Initialize selectors
        this.contentSelect = document.getElementById('content-select');
        this.contentSelect.onchange = (evt) => this.setImage(this.contentImg, evt.target.value);
        this.contentSelect.onclick = () => this.contentSelect.value = '';
        this.styleSelect = document.getElementById('style-select');
        this.styleSelect.onchange = (evt) => this.setImage(this.styleImg, evt.target.value);
        this.styleSelect.onclick = () => this.styleSelect.value = '';
      }
    
      connectImageAndSizeSlider(img, slider, square) {
        slider.oninput = (evt) => {
          img.height = evt.target.value;
          if (img.style.width) {
            // If this branch is triggered, then that means the image was forced to a square using
            // a fixed pixel value.
            img.style.width = img.height+"px";  // Fix width back to a square
          }
        }
        if (square !== undefined) {
          square.onclick = (evt) => {
            if (evt.target.checked) {
              img.style.width = img.height+"px";
            } else {
              img.style.width = '';
            }
          }
        }
      }
    
      // Helper function for setting an image
      setImage(element, selectedValue) {
        if (selectedValue === 'file') {
          console.log('file selected');
          this.fileSelect.onchange = (evt) => {
            const f = evt.target.files[0];
            const fileReader = new FileReader();
            fileReader.onload = ((e) => {
              element.src = e.target.result;
            });
            fileReader.readAsDataURL(f);
            this.fileSelect.value = '';
          }
          this.fileSelect.click();
        } else if (selectedValue === 'pic') {
          this.openModal(element);
        } else if (selectedValue === 'random') {
          const randomNumber = Math.floor(Math.random()*links.length);
          element.src = links[randomNumber];
        } else {
          element.src = 'images/' + selectedValue + '.jpg';
        }
      }
    
      enableStylizeButtons() {
        this.styleButton.disabled = false;
        this.styleButton.textContent = 'Stylize';
      }
    
      disableStylizeButtons() {
        this.styleButton.disabled = true;
      }
    
      async startStyling() {
        //visual update only
        await tf.nextFrame();
        this.styleButton.textContent = 'Generating 100D style representation';
        await tf.nextFrame();
        //styleNet.Predict is probably important
        let bottleneck = await tf.tidy(() => {
          return this.styleNet.predict(tf.browser.fromPixels(this.styleImg).toFloat().div(tf.scalar(255)).expandDims());
        })
        if (this.styleRatio !== 1.0) {
          this.styleButton.textContent = 'Generating 100D identity style representation';
          await tf.nextFrame();
          const identityBottleneck = await tf.tidy(() => {
            return this.styleNet.predict(tf.browser.fromPixels(this.contentImg).toFloat().div(tf.scalar(255)).expandDims());
          })
          const styleBottleneck = bottleneck;
          bottleneck = await tf.tidy(() => {
            const styleBottleneckScaled = styleBottleneck.mul(tf.scalar(this.styleRatio));
            const identityBottleneckScaled = identityBottleneck.mul(tf.scalar(1.0-this.styleRatio));
            return styleBottleneckScaled.addStrict(identityBottleneckScaled)
          })
          styleBottleneck.dispose();
          identityBottleneck.dispose();
        }
        this.styleButton.textContent = 'Stylizing image...';
        await tf.nextFrame();
        const stylized = await tf.tidy(() => {
          return this.transformNet.predict([tf.browser.fromPixels(this.contentImg).toFloat().div(tf.scalar(255)).expandDims(), bottleneck]).squeeze();
        })
        await tf.browser.toPixels(stylized, this.stylized);
        bottleneck.dispose();  // Might wanna keep this around
        stylized.dispose();
      }
    
      async benchmark() {
        const x = tf.randomNormal([1, 256, 256, 3]);
        const bottleneck = tf.randomNormal([1, 1, 1, 100]);
    
        let styleNet = await this.loadInceptionStyleModel();
        let time = await this.benchmarkStyle(x, styleNet);
        styleNet.dispose();
    
        styleNet = await this.loadMobileNetStyleModel();
        time = await this.benchmarkStyle(x, styleNet);
        styleNet.dispose();
    
        let transformNet = await this.loadOriginalTransformerModel();
        time = await this.benchmarkTransform(
            x, bottleneck, transformNet);
        transformNet.dispose();
    
        transformNet = await this.loadSeparableTransformerModel();
        time = await this.benchmarkTransform(
          x, bottleneck, transformNet);
        transformNet.dispose();
    
        x.dispose();
        bottleneck.dispose();
      }
    
      async benchmarkStyle(x, styleNet) {
        const profile = await tf.profile(() => {
          tf.tidy(() => {
            const dummyOut = styleNet.predict(x);
            dummyOut.print();
          });
        });
        console.log(profile);
        const time = await tf.time(() => {
          tf.tidy(() => {
            for (let i = 0; i < 10; i++) {
              const y = styleNet.predict(x);
              y.print();
            }
          })
        });
        console.log(time);
      }
    
      async benchmarkTransform(x, bottleneck, transformNet) {
        const profile = await tf.profile(() => {
          tf.tidy(() => {
            const dummyOut = transformNet.predict([x, bottleneck]);
            dummyOut.print();
          });
        });
        console.log(profile);
        const time = await tf.time(() => {
          tf.tidy(() => {
            for (let i = 0; i < 10; i++) {
              const y = transformNet.predict([x, bottleneck]);
              y.print();
            }
          })
        });
        console.log(time);
      }
}