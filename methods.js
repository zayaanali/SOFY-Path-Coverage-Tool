import { getScenario, masterJSON, getNode, imageDiff, getSubNode, doesNodeExist, addNode, removeEdge, updateCheckboxArray, getNodeIndex, removeSubNode, removeNodeGroup } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import { allSimplePaths } from 'graphology-simple-path';
import { Sigma } from 'sigma';
import circular from 'graphology-layout/circular';

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";

import { isValidJSON } from './tools.js';
import { hiltonMasterGroup } from './old-run-data/hilton-master-group.js';


// var allowedDiff = 0.005;

/*
* Takes JSON string and returns tuples containing the node and the image link associated with it. Also builds graph
*/
async function parseJSON(jsonStr, nodeGroups, ) {
    

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
       i = await addNode(jsonArr, i, arrLength, nodeGroups); // adds the node of the given index to the array of representative nodes       
    }

}

function getNodeGroupRow(node, checkedItems) {
    // Create div for entire row and give class
    const nodeGroupDiv = document.createElement('div'); 
    nodeGroupDiv.className = 'node-group-div'   
    
    // Create div which will contain both image and checkbox for representative node
    const nodeDiv = document.createElement('div');
    nodeDiv.className='image-div'
    
    // create text
    const txt = document.createElement('p');
    txt.className = 'group-text'
    txt.textContent = "Node Group";
    
    // Create image and checkbox elements for representive node
    const nodeImage = document.createElement('img');
    nodeImage.src=node.image;
    
    const checkbox = document.createElement('input');
    checkbox.className='checkboxes'
    checkbox.type = 'checkbox';
    checkbox.dataset.id = node.nodeID;
    checkbox.addEventListener('change', () => { let checked = checkbox.checked; updateCheckboxArray(checked, checkedItems, node);  });
    
    // add image and checkbox to representative node div
    nodeDiv.appendChild(txt)
    nodeDiv.appendChild(nodeImage)
    nodeDiv.appendChild(checkbox)
    

    // Insert the node div into the container
    nodeGroupDiv.appendChild(nodeDiv)
    
    // insert subnodes after the representative node
    for (let subNode of node.subNodes) {
        // Create div to contain image and checkbox
        const subNodeDiv = document.createElement('div');
        subNodeDiv.className='image-div'
        
        
        const txt2 = document.createElement('p');
        txt2.className = 'group-text'
        txt2.textContent = "Subnode";
        // create image and checkbox elements
        const subNodeImage = document.createElement('img');
        subNodeImage.src=subNode.image;
        
        const checkbox2 = document.createElement('input');
        checkbox2.className='checkboxes'
        checkbox2.type = 'checkbox';
        checkbox2.dataset.id = node.nodeID;
        checkbox2.addEventListener('change', () => { let checked = checkbox2.checked; updateCheckboxArray(checked, checkedItems, subNode) });
        subNodeDiv.appendChild(txt2)
        subNodeDiv.appendChild(subNodeImage)
        subNodeDiv.appendChild(checkbox2)
        

        // insert image/checkbox to row
        nodeGroupDiv.appendChild(subNodeDiv)
    }

    return nodeGroupDiv
}

function makeNodeGroup(checkedItems, options) {
    if (checkedItems.length==0)
        return;
    
    let nodeGroup;
    
    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  

    // Create a new node to create a new nodeGroup
    let newNode = {
        nodeID: checkedItems[0].nodeID,
        actionID: checkedItems[0].actionID,
        image: checkedItems[0].image,
        subNodes: []
    }
    
    // remove all subnodees
    for (let subNode of checkedItems) {
        // Remove the node from the subnode array
        removeSubNode(nodeGroup, subNode);
    }

    // add subnodes to new node just created
    for (let i=1; i< checkedItems.length; i++) {
        newNode.subNodes.push(checkedItems[i])
    }

    // add node just created into the array   
    nodeGroup.push(newNode);

    checkedItems=[];
    
    // update nodeGroup
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
     else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));
         
}

function makeSubNode(checkedItems, options) {
    if (checkedItems.length==0)
        return;
    
    let nodeGroup;

    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  
    
    // Get index of node group adding to
    let nodeIndex = getNodeIndex(nodeGroup, checkedItems[0]);
    
        
    
    // add subnodes to nodeindex
    for (let i=1; i<checkedItems.length; i++) {
        removeSubNode(nodeGroup, checkedItems[i]);
        nodeGroup[nodeIndex].subNodes.push(checkedItems[i])
    }

    // update masterNodeGroup
    checkedItems=[];
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
    else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));  
}

function mergeNodeGroups(checkedItems, options) {
    console.log(checkedItems)
    
    if (checkedItems.length==0)
        return;

    let nodeGroup;
    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  
    
    
    const baseNodeIndex = getNodeIndex(nodeGroup, checkedItems[0]);
    for (let i=1; i<checkedItems.length; i++) {        
        // convert old nodeGroup to subNode and add as a subnode to the base node group
        let newSubNode = {
            nodeID: checkedItems[i].nodeID,
            actionID: checkedItems[i].actionID,
            image: checkedItems[i].image,
        }
        nodeGroup[baseNodeIndex].subNodes.push(newSubNode)
        
        for (let subNode of checkedItems[i].subNodes) {
            nodeGroup[baseNodeIndex].subNodes.push(subNode)
        }
    }

    // Remove other node groups
    for (let i=1; i<checkedItems.length; i++) {
        removeNodeGroup(nodeGroup, checkedItems[i])
    }
    
    // update masterNodeGroup
    checkedItems=[];
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
    else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));  



}

/**
 * 
 * builds a graph given the master JSON as well as the master node groups
 */

function buildGraph(masterJSON, nodeGroup) {
    const scenario = masterJSON.scenario
    console.log(scenario)
    let newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
 
    for (let i=0; i<scenario.length; i++) {
        let curNode = getRepresentativeNode(nodeGroup, masterJSON.scenarioGUID+'->'+scenario[i].actionIndex)
        newGraph.mergeNode(curNode.nodeID, { type: "image", label: curNode.actionID, image: curNode.image, size: 10 });

        if (i+1<scenario.length) {
            let nextNode = getRepresentativeNode(nodeGroup, masterJSON.scenarioGUID+'->'+scenario[i+1].actionIndex)
            newGraph.mergeNode(nextNode.nodeID, { type: "image", label: nextNode.actionID, image: nextNode.image, size: 10 });
            newGraph.mergeEdge(curNode.nodeID, nextNode.nodeID);
        }
    }

    return newGraph


    function getRepresentativeNode(nodeGroup, findIDX) {
        for (const node of nodeGroup) {
            if (node.nodeID==findIDX)
                return node;

            for (const subNode of node.subNodes) {
                if (subNode.nodeID==findIDX)
                    return node;
            }
        }
    }
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
    button.addEventListener("click", downloadPath.bind(null, pathArr));
    buttonContainer.appendChild(button);

}


function downloadPath(path) {
    console.log(path)
    // Get master JSON
    const master = JSON.parse(masterJSON.getValue());
    
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



/*
 * Ignore - this function is used for testing purposes
 */
async function testFunction() {
    
    
    
    console.log('here')
    
    // const img1='http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.rover.android%5Ca9e36657-5634-4db8-addf-2015342cf0b5%5Cmaster-test1%5CImages%5C1691688008832.png'
    // const img2='http://portalvhdsld5gs9t7pkkvf.blob.core.windows.net/qbot/quantyzdandroidruns/Scenarios%5Ccom.rover.android%5Ca9e36657-5634-4db8-addf-2015342cf0b5%5Cmaster-test1%5CImages%5C1691688011753.png'


    // //2.5% difference
    // let diff = await imageDiff(img1, img2)
    // console.log(diff)    


}




export { buildGraph, getNotVisitedPaths, testFunction, parseJSON, createPathJSON, getNotVisitedNodes, makeNodeGroup, makeSubNode };
export { displayPath, displayUnvisitedNodes, getNodeGroupRow, mergeNodeGroups }
