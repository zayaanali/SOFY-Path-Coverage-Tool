import { isValidJSON, getScenario, masterJSON, getNode, imageDiff, getSubNode, doesNodeExist, addNode, removeEdge } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import { allSimplePaths } from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";


import { hiltonMasterGroup } from './old-run-data/hilton-master-group.js';

var allowedDiff = 0.005;

/*
* Takes JSON string and returns tuples containing the node and the image link associated with it. Also builds graph
*/
async function parseJSON(jsonStr, nodeArr) {
    

    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    let returnArr=[];
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        alert("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    
    // Building concise node array (placing identical screen as subnodes)
    for (var i=0; i<arrLength;i++) {
       i = await addNode(jsonArr, i, arrLength, nodeArr); // adds the node of the given index to the array of representative nodes       
    }
    
    // building full node array
    for (var i=0; i<arrLength;i++) {
        returnArr.push(getNode(jsonArr, i))
    }
    return returnArr;
}

async function buildGraph(jsonStr, nodeArr) {
    

    var newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
    let returnArr=[];
    let node;
    let tempIndex;
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        alert("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    let lastNodeIndex=0; // index of last node that was found
    node=getNode(jsonArr,0);
    newGraph.mergeNode(node.nodeID, { type: "image", label: node.actionID, image: node.image, size: 10 }); // add node to graph
    nodeArr.push(node); // add the node to the array

    // Building concise node array (placing identical screen as subnodes)
    for (var i=1; i<arrLength;i++) {
        
        // Get the image of the current node
        let curNode = jsonArr.scenario[i];
        
        // get the index of the node if it already exists in the array
        
        let nodeIndex = await doesNodeExist(nodeArr, curNode.snapshotLocation);
        
        
        // if already exists in array
        if (nodeIndex!=-1) {
            
            nodeArr[nodeIndex].subNodes.push(getSubNode(jsonArr, i));
            if (!newGraph.hasEdge(nodeArr[nodeIndex].nodeID, nodeArr[lastNodeIndex].nodeID))
                newGraph.mergeEdge(nodeArr[lastNodeIndex].nodeID, nodeArr[nodeIndex].nodeID, { type: "arrow" }); // add an edge between the last node in the array and the node that is being added
            
            lastNodeIndex=nodeIndex; // set the last node as representative node that was just processed
            
        } else { // does not exist in the array yet
            node=getNode(jsonArr,i);
            newGraph.mergeNode(node.nodeID, { type: "image", label: node.actionID, image: node.image, size: 10 }); // add node to graph
            if (!newGraph.hasEdge(node.nodeID, nodeArr[lastNodeIndex].nodeID))
                newGraph.mergeEdge(nodeArr[lastNodeIndex].nodeID, node.nodeID, {type: "arrow" }); // add an edge between the last node in the array and the node that is being added
            
            nodeArr.push(node); // add the node to the array
            lastNodeIndex=nodeArr.length-1; // last node is now set to node that was just processed
        }
            
        
        let nextIndex = i+1;
        let done = false;
        
        // for all next nodes check if they are subnodes
        while (!done && nextIndex<arrLength) {
            
            // Get the next image and compute difference between current and next image
            let nextImage = jsonArr.scenario[nextIndex].snapshotLocation;
            let diff = await imageDiff(curNode.snapshotLocation, nextImage);

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
                i = nextIndex-1; // will be incremented by the forloop
                // return nextIndex-1;
            }
        }
    }
    
    // building full node array
    for (var i=0; i<arrLength;i++) {
        returnArr.push(getNode(jsonArr, i))
    }
    
    return newGraph;
}

async function getNotVisitedNodes(masterNodeGroup, childNodeGroup, maxDiff) {
    
    // Create a deep copy of master array 
    let toVisitArr= JSON.parse(JSON.stringify(masterNodeGroup));
    let toRemove=[];
    
    // Iterate through each node of the master. If matched with a node in the child mark for removal
    for (let i=0; i<masterNodeGroup.length; i++) {
        for (let childNode of childNodeGroup) {
            let diff =  await imageDiff(masterNodeGroup[i].image, childNode.image)
            if (diff<=maxDiff)
                toRemove.push(i);
        }
    }
   
    // Remove all nodes that have already been visited and return
    return toVisitArr.filter((item, index) => !toRemove.includes(index));

}
/*
* This function takes a graph as well as list of child nodes and returns all of the
* paths that have not been traversed yet from the start node (first node in the master)
*/
function getNotVisitedPaths(masterGraph, targetNode) {
    
    // Get list of nodes in the master
    var masterNodes=[];
    masterGraph.forEachNode((node, attributes) => {
        masterNodes.push(node);
    });

    return allSimplePaths(masterGraph, masterNodes[0], targetNode)
    
}





/**
 * This function takes in an array of unvisited nodes and displays the image
 * on the page with buttons for each node
 */
function displayUnvisitedNodes(masterGraph, masterNodeGroup, notVisitedNodes) {
    var checkedItems=[];
    displayImages();

    function displayImages() {
        
        const imageContainer = document.querySelector('.unvisited-node-display');
        imageContainer.innerHTML = ''; // Clear previous content
      
        for (const node of notVisitedNodes) {
            const imageElement = document.createElement('img');
            imageElement.src = node.image;
        
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.className='image-button';
            removeButton.addEventListener('click', () => removeImage(node.nodeID));

            const button = document.createElement('button');
            button.className = 'image-button';
            button.textContent = 'Generate Paths';
            button.addEventListener('click', () => {
                displayPathButtons(masterGraph, masterNodeGroup, node.nodeID)
            });

            const checkbox = document.createElement('input');
            checkbox.className='checkboxes'
            checkbox.type = 'checkbox';
            checkbox.dataset.id = node.nodeID;
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    checkedItems.push(node);
                } else {
                    const indexToRemove = checkedItems.findIndex(item => item.nodeID === node.nodeID);
                    if (indexToRemove !== -1) {
                        checkedItems.splice(indexToRemove, 1);
                    }
                }
                console.log('Checked Items:', checkedItems); // Display checked items in console
            });

            const imageContainerDiv = document.createElement('div');
            imageContainerDiv.className = 'image-div'
            imageContainerDiv.appendChild(imageElement);
            imageContainerDiv.appendChild(button);
            imageContainerDiv.appendChild(removeButton);
            imageContainerDiv.appendChild(checkbox);
            
            imageContainer.appendChild(imageContainerDiv);
        }
    }
    function removeImage(id) {
        const indexToRemove = notVisitedNodes.findIndex(item => item.nodeID == id);
        if (indexToRemove !== -1) {
            notVisitedNodes.splice(indexToRemove, 1);
            refreshImages();
        }
    }
    function refreshImages() {
        const imageContainer = document.querySelector('.unvisited-node-display');
        imageContainer.innerHTML = ''; // Clear previous content
        displayImages(); // Display the updated images
    }

    function mergeNodes() {
        let baseNode = checkedItems[0].nodeID;
        
        // Iterate through each of the check
        for (let i=1; i<checkedItems.length; i++) {
            
            masterGraph.forEachInEdge(checkedItems[i].nodeID,
                (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
                    masterGraph.mergeEdge(source, baseNode)

            });
            
            masterGraph.forEachOutEdge(checkedItems[i].nodeID,
                (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
                    masterGraph.mergeEdge(baseNode, target)
            });
            
            masterGraph.dropNode(checkedItems[i].nodeID)
            removeImage(checkedItems[i].nodeID)
            console.log(notVisitedNodes)
        }
        checkedItems=[]

    }
    document.getElementById('merge-nodes').addEventListener('click', mergeNodes)
}

/**
 * This function takes and displays all of the paths that include the edge
 */
function displayPathButtons(masterGraph, masterNodeGroup, target) {

    const notVisitedPaths = getNotVisitedPaths(masterGraph, target, { maxDepth: 20 });
    // Get the button container element
    var container = document.getElementById("paths-selection");
    container.innerHTML='';

    // Loop through the paths array
    for (var i = 0; i < notVisitedPaths.length; i++) {
        var path = notVisitedPaths[i];

        // Create a button for the current path
        var pathButton = document.createElement("button");
        pathButton.textContent = 'Path '+(i+1); // Display the path name

        // Add an event listener to the path button
        pathButton.addEventListener("click", displayPath.bind(null, masterGraph, masterNodeGroup, path));
        container.appendChild(pathButton);
    }


}





function displayPath(masterGraph, masterNodeGroup, path) {
    
    let pathArr=[];
    for (let id of path) {
        let node = masterNodeGroup.find(node => node.nodeID == id);
        pathArr.push(node);
    }
    
    const imageContainer = document.getElementById('paths-display');
    imageContainer.innerHTML='';
    
    for (let i=0; i<pathArr.length; i++) {
        // create div to hold both image and buttons
        const imageDiv = document.createElement('div');
        imageDiv.className='image-div';
        
        // create div to hold just the buttons
        const buttonDiv = document.createElement('div');
        buttonDiv.className='button-div'

        // create image element
        const imgElement = document.createElement('img');
        imgElement.src = pathArr[i].image;

        // create button elements
        const removeLeft = document.createElement('button');
        removeLeft.textContent = 'left'
        removeLeft.className = 'remove-edge-button'
        removeLeft.addEventListener('click', () => removeEdge(masterGraph, pathArr[i-1], pathArr[i]) );

        const removeRight = document.createElement('button');
        removeRight.textContent = 'right'
        removeRight.className = 'remove-edge-button'
        removeRight.addEventListener('click', () => removeEdge(masterGraph, pathArr[i], pathArr[i+1]) );

        // Append buttons to button div
        buttonDiv.appendChild(removeLeft);
        buttonDiv.appendChild(removeRight);

        // append elements to imagediv
        imageDiv.appendChild(imgElement);
        imageDiv.appendChild(buttonDiv);

        imageContainer.appendChild(imageDiv);
    }

    let buttonContainer = document.getElementById('path-download');
    buttonContainer.innerHTML='';
    let button = document.createElement('button');
    button.textContent = "Download Path";
    button.addEventListener("click", downloadPath.bind(null, path));
    buttonContainer.appendChild(button);

}


function downloadPath(path) {
    console.log(path)
    // Get master JSON
    // var master = JSON.parse(masterJSON.getValue());
    const master = hiltonMaster;
    
    var newJSON = createPathJSON(master, path);
    
    console.log(newJSON)
}





/*
 * creates a JSON for a corresponding path to be able to run a test
 */
function createPathJSON(master, path) {
    
    // create a deep copy of the master to modify
    var newJSON = JSON.parse(JSON.stringify(master));
    
    // set the scenario to empty
    newJSON.scenario=[];

    // for each node on the path, add the node to the scenario
    for (var node of path)
        newJSON.scenario.push(getScenario(master, node));
    
    return newJSON
}





var idx =24




/*
 * Ignore - this function is used for testing purposes
 */
async function testFunction() {
    
    
    
    
    
    const img1='http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C8f2038bd-38d0-4f0b-9eee-5e162fdb5fce%5Csearchtest-master-3%5CImages%5C1691516144270.png'
    const img2='http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.hilton.android.hhonors%5C8f2038bd-38d0-4f0b-9eee-5e162fdb5fce%5Csearchtest-master-3%5CImages%5C1691516144420.png'


    //2.5% difference
    let diff = await imageDiff(img1, img2)
    console.log(diff)    

    

    
    

    // let imageArr=[];
    // for (let node of hiltonMasterGroup) {
    //     let arr=[]
    //     arr.push(node.image)
    //     for (let subnode of node.subNodes)
    //         arr.push(subnode.image)

    //     imageArr.push(arr)
    // }

    // const imageContainer = document.getElementById('test-container');
    // imageContainer.innerHTML='';
    // console.log(imageArr)
    // imageArr[idx].forEach(imageUrl => {
    //     const imgElement = document.createElement('img');
    //     imgElement.src = imageUrl;
    //     imgElement.classList.add('image');

    //     imageContainer.appendChild(imgElement);
    // });
    // if (imageArr[idx].length>=2)
    //     console.log(100* await imageDiff(imageArr[24][0], imageArr[29][0]))
    // console.log(imageArr[24][0], imageArr[29][0])
    // console.log(idx)
    // idx++;
    // var masterGraph = Graph.from(hiltonGraph)

    
    // // Give nodes (x,y) positions in circular manner
    // circular.assign(masterGraph, { scale: 10 });

    // const sensibleSettings = forceAtlas2.inferSettings(masterGraph);
    // const fa2Layout = new FA2Layout(masterGraph, {
    //     settings: sensibleSettings,
    // });

    // fa2Layout.start();

    // // change edge sizes
    // masterGraph.edges().forEach(key => {
    //     masterGraph.setEdgeAttribute(key, 'size', 3);
    // })
    
    // // output to page
    // const container = document.getElementById('master-graph-display');
    // container.innerHTML='';

    // let hoveredEdge = null;
    // const renderer = new Sigma(masterGraph, container, {
    //     nodeProgramClasses: {
    //         image: getNodeProgramImage()
    //     },
    //     enableEdgeHoverEvents: "debounce",
    //     edgeReducer(edge, data) {
    //         const res = { ...data };
    //         if (edge === hoveredEdge) res.color = "#cc0000";
    //         return res;
    //     },
    // });
    
    // renderer.on("enterEdge", ({ edge }) => {
    //     hoveredEdge = edge;
    //     renderer.refresh();
    // });
    // renderer.on("leaveEdge", ({ edge }) => {
    //     hoveredEdge = null;
    //     renderer.refresh();
    // });

    // renderer.refresh();

}











export { buildGraph, getNotVisitedPaths, testFunction, parseJSON, createPathJSON, getNotVisitedNodes };
export { displayPath, displayUnvisitedNodes }
