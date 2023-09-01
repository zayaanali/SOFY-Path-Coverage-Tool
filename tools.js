import Pixelmatch from "pixelmatch";

/* 
* Function to check if given string is a valid JSON
*/
function isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
}

/**
 * Finds whether node group exists in array by matching nodeIDs
 */
function doesNodeIdExist(nodeGroupArray, nodeIDToCheck) {
    for (const node of nodeGroupArray) {
        if (node.nodeID==nodeIDToCheck)
            return true;
    }
    return false;
}

/**
 * Function takes in two image URLs and returns the image percentage diff
 */
async function imageDiff(image1, image2) {
    
  let diff= await compareImages(image1, image2)
  return diff;

  async function compareImages(imageUrl1, imageUrl2) { 
      try {
          const image1 = await loadImage(imageUrl1);
          const image2 = await loadImage(imageUrl2);
          if (image1.width !== image2.width || image1.height !== image2.height) {
              alert("Both images should have the same dimensions.");
              return;
          }
        
          const width = image1.width;
          const height = image1.height;
  
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true});
  
          context.drawImage(image1, 0, 0);
          const img1 = context.getImageData(0, 0, width, height);
  
  
          context.drawImage(image2, 0, 0);
          const img2 = context.getImageData(0, 0, width, height);
  
          const diffCanvas = document.createElement("canvas");
          diffCanvas.width = width;
          diffCanvas.height = height;
          const diffContext = diffCanvas.getContext("2d", { willReadFrequently: true});

          const numDiffPixels = Pixelmatch(img1.data, img2.data, diffContext.data, width, height, {
              threshold: 0.1, // Adjust the threshold as needed (0.1 by default)
          });
  
          let percentDiff = numDiffPixels/(width*height);
          //console.log("Percent Difference: ", percentDiff)
          return percentDiff;
      
      
      } catch (error) {
          console.error("Error:", error);
      }
  
      // helper function
      function loadImage(imageUrl) {
          return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.crossOrigin = "Anonymous";
              img.src = imageUrl;
          });
      }
  }
}



export { isValidJSON, doesNodeIdExist, imageDiff }