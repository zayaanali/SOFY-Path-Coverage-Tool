// File containing helper functions

import Pixelmatch from "pixelmatch";
import { makeNodeGroup, makeSubNode } from "./helpers2";
var allowedDiff = 0.005


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


/* 
* Function to get all required node information from JSON
*/
function getNode(jsonArr, idx) {
    var node = {
        nodeID: generateIDs(),
        actionID: parseInt(jsonArr.scenario[idx].actionIndex)+1,
        image: jsonArr.scenario[idx].snapshotLocation,
        subNodes: []
    }

    return node;
}


function getSubNode(jsonArr, idx) {
    var node = {
        nodeID: generateIDs(),
        actionID: parseInt(jsonArr.scenario[idx].actionIndex)+1,
        image: jsonArr.scenario[idx].snapshotLocation,
    }

    return node;
}


/**
 * This function takes a master file an activity name and then returns the entire scenario data
 */
function getScenario(master, node) {
    console.log('nodeID:', node.actionID)
    for (let scenario of master.scenario) {
        let id= parseInt(scenario.actionIndex)+1;
        console.log(id)
        if (id==node.actionID)
            return scenario
    }
    
    //alert('node not found');
}


/**
 * Retainer function for masterJSON
 */
var masterJSON = (function() {
    var retainedValue;
  
    function setValue(value) {
      retainedValue = value;
    }
  
    function getValue() {
      return retainedValue;
    }
  
    return {
      setValue: setValue,
      getValue: getValue
    };
})();


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

/**
 * 
 * finds whether a node exists in the given array by using image matching
 */
async function doesNodeExist(nodeArr, img) {
    // iterate through the node array
    
    for (let i=0; i<nodeArr.length; i++) {
        // calculate the difference between the current image and the given image
        let diff = await imageDiff(nodeArr[i].image, img);
        // if the difference is less than 0.075 return the index of the matching image
        if (diff<=allowedDiff)
            return i;    
    }

    // if no matching images found return -1
    return -1;
}


async function addNode(jsonArr, i, arrLength, nodeArr) {
     // Get the image of the current node
     let curNodeImage = jsonArr.scenario[i].snapshotLocation;
        
     // get the index of the node if it already exists in the array
     let nodeIndex = await doesNodeExist(nodeArr, curNodeImage);
     // console.log(i+1, " Matches: ", nodeIndex+1)
     
     // if already exists in array
     if (nodeIndex!=-1)
         nodeArr[nodeIndex].subNodes.push(getSubNode(jsonArr, i));
     else 
         nodeArr.push(getNode(jsonArr, i));
     
     let nextIndex = i+1;
     let done = false;
     
     // for all next nodes check if they are subnodes
     while (!done && nextIndex<arrLength) {
         
         // Get the next image and compute difference between current and next image
         let nextImage = jsonArr.scenario[nextIndex].snapshotLocation;
         let diff = await imageDiff(curNodeImage, nextImage);

         // if the difference is less than 5% they are subnodes
         if (diff<=allowedDiff) {
             // check if the node that compared to is a subnode or representative node
             if (nodeIndex!=-1) // subnode
                 nodeArr[nodeIndex].subNodes.push(getSubNode(jsonArr, nextIndex)); // use the index found previously
             else // representative node
                 nodeArr[nodeArr.length-1].subNodes.push(getSubNode(jsonArr, nextIndex)); // use the index of the node that was just added to the array
             
             nextIndex++; // increment the temp index
         } else { // difference is more than 5% so don't do anything
             done=true;
            //  i = nextIndex-1; // will be incremented by the forloop
            return nextIndex-1;
         }
     }
     return i;    
}


var existingIds=new Set();

function generateIDs() {
    const characters = '0123456789';
    const idLength = 10;
    
    while (true) {
        let newId = '';
        for (let i = 0; i < idLength; i++)
            newId += characters.charAt(Math.floor(Math.random() * characters.length));
        
        if (!existingIds.has(newId)) {
            existingIds.add(newId)
            return newId;
        }
            
    }
}

function removeEdge(masterGraph, startNode, endNode) {
    if (masterGraph.hasEdge(startNode.nodeID, endNode.nodeID))
        masterGraph.dropEdge(startNode.nodeID, endNode.nodeID)
}

function displayMasterGroup() {

    const imageContainer = document.getElementById('node-group-display');
    imageContainer.innerHTML='';
    
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    let checkedItems=[];

    for (let node of masterNodeGroup) {
        // Create div for entire group
        const nodeGroupDiv = document.createElement('div'); 
        nodeGroupDiv.className = 'node-group-div'   
        
        // Create image div for the representative node of node group
        const nodeDiv = document.createElement('div');
        nodeDiv.className='image-div'
        
        const nodeImage = document.createElement('img');
        nodeImage.src=node.image;
        
        const checkbox = document.createElement('input');
        checkbox.className='checkboxes'
        checkbox.type = 'checkbox';
        checkbox.dataset.id = node.nodeID;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                checkedItems.push(node);
            } else {
                const indexToRemove = checkedItems.findIndex(item => item.nodeID === node.nodeID);
                if (indexToRemove !== -1)
                    checkedItems.splice(indexToRemove, 1);
            }
        });
        nodeDiv.appendChild(nodeImage)
        nodeDiv.appendChild(checkbox)

        nodeGroupDiv.appendChild(nodeDiv)
        
        // insert subnodes of after the representative node
        for (let subNode of node.subNodes) {
            // Create image div for the subNode of node group
            const subNodeDiv = document.createElement('div');
            subNodeDiv.className='image-div'
            
            const subNodeImage = document.createElement('img');
            subNodeImage.src=subNode.image;
            
            const checkbox2 = document.createElement('input');
            checkbox2.className='checkboxes'
            checkbox2.type = 'checkbox';
            checkbox2.dataset.id = node.nodeID;
            checkbox2.addEventListener('change', () => {
                if (checkbox2.checked) {
                    checkedItems.push(subNode);
                } else {
                    const indexToRemove = checkedItems.findIndex(item => item.nodeID === subNode.nodeID);
                    if (indexToRemove !== -1)
                        checkedItems.splice(indexToRemove, 1);
                }
            });
            subNodeDiv.appendChild(subNodeImage)
            subNodeDiv.appendChild(checkbox2)

            nodeGroupDiv.appendChild(subNodeDiv)
        }

        imageContainer.appendChild(nodeGroupDiv);
    }
    
    const createNodeGroupButton = document.getElementById('make-node-group');
    createNodeGroupButton.addEventListener("click", () => makeNodeGroup(checkedItems));

    const makeSubNodeButton = document.getElementById('make-subnode');
    makeSubNodeButton.addEventListener("click", () => makeSubNode(checkedItems));


    
}

function displayChildGroup() {
    const imageContainer = document.getElementById('node-group-display');
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    const childNodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
}






export { isValidJSON, masterJSON, getScenario, getNode, imageDiff, getSubNode, doesNodeExist, addNode, removeEdge, displayChildGroup, displayMasterGroup }


