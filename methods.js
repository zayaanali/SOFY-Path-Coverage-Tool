import { getScenario, masterJSON, imageDiff, addNode, removeEdge, updateCheckboxArray, getNodeIndex, removeSubNode, removeNodeGroup, getRepresentativeNode } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import { allSimplePaths } from 'graphology-simple-path';
import { isValidJSON } from './tools.js';


/*
* Takes JSON string and builds array of node groups based on it. Node Groups passed as parameter so that node groups 
* can be added onto when processing multiple files
*/
async function parseJSON(jsonStr, nodeGroups) {

    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        console.error("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    var jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    
    // Building concise node array (placing identical screen as subnodes). Add each node in JSON array
    for (var i=0; i<arrLength;i++)
       i = await addNode(jsonArr, i, arrLength, nodeGroups); // adds the node of the given index to the array of representative nodes

}


/*
* Given a single node group (representative node + subnodes) build a div with images of representative
* node and subnodes in a row. Maintains an array of which items are checked to be used node group array modification
*/
function getNodeGroupRow(node, checkedItems) {
    // Create div for entire row and give class
    const nodeGroupDiv = document.createElement('div'); 
    nodeGroupDiv.className = 'node-group-div'   
    
    // Create div which will contain both image and checkbox for representative node
    const nodeDiv = document.createElement('div');
    nodeDiv.className='image-div'
    
    // create text signifying node group
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
    
    // insert subnodes after the representative node. Create and insert div for each subnode
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

/**
 * Takes an array of checkedItems (from master/child group display). Each of the elements of checkedItems must be subNode
 * Makes the first element of checkedItems the new Group node and the following elements subNodes of the first element
 * To call this function pass the following:
 * makeNodeGroup(checkedItems, {master: [true/false] })
 * second paremeter denotes whether this should be editing the master group or the child group
 */
function makeNodeGroup(checkedItems, options) {
    // If there are no elements in checked items array then return
    if (!checkedItems)
        return;
    
    // Depending on parameter option passed through set nodeGroup as child or master group
    let nodeGroup;
    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  

    // Make new representative node (to contain a number of sub nodes) containing info from first element
    let newNode = {
        nodeID: checkedItems[0].nodeID,
        actionID: checkedItems[0].actionID,
        image: checkedItems[0].image,
        subNodes: []
    }
    
    // Make sure all elements of checkedItems are subNodes
    for (let subNode of checkedItems) {
        if ('subNodes' in subNode)
            console.error('only subnodes should be added');        
    }

    // Remove first subnode
    removeSubNode(nodeGroup, checkedItems[0]);
    
    // Remove the subnode from its original place in the array and add it to the subnode array of node just created
    for (let i=1; i< checkedItems.length; i++) {
        removeSubNode(nodeGroup, checkedItems[i]);
        newNode.subNodes.push(checkedItems[i]);
    }

    // add node just created into the node group array 
    nodeGroup.push(newNode);

    
    // Reset checkedItems and update nodeGroup in localstorage
    checkedItems=[];
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
     else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));
         
}

/**
 * This function takes an array of checkedItems and options parameter to specify if master is used (see makeNodeGroup function definition for usage)
 * First element of checked items must be representative node (node group element) and the rest must be subnodes
 * Moves all of the subnodes in the checkedItems array to representative node
 */

function makeSubNode(checkedItems, options) {
    // if checkedItems empty then return
    if (!checkedItems)
        return;
    
    // Depending on the options parameter set nodeGroup to child or master group, get from localstorage
    let nodeGroup;
    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  
    
    // Get the index of the node adding to in nodeGroup (index of first element of checkedItems)
    let nodeIndex = getNodeIndex(nodeGroup, checkedItems[0]);
    
    // Make sure first node is Group Node, all remaining nodes are subnodes
    for (let i=0; i<checkedItems.length; i++) {
        if (i==0 && !('subNodes' in checkedItems[i]))
            console.error('First element must be Group Node')
        else if (i!=0 && 'subNodes' in checkedItems[i])
            console.error('All elements but first must be sub nodes')
    }
    
    // remove subNodes from original localtion add subnodes to representative node
    for (let i=1; i<checkedItems.length; i++) {
        removeSubNode(nodeGroup, checkedItems[i]);
        nodeGroup[nodeIndex].subNodes.push(checkedItems[i])
    }

    // update masterNodeGroup and reset checkedItems array
    checkedItems=[];
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
    else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));  
}

/**
 * Function takes an array of checkedItems and option parameter which specifies if modification is being done master or child groups
 * All elements in the checkedItems array should be group nodes (representative nodes)
 * First element of checkedItems array is the base node, all other group nodes (+subnodes) are merged into the base node
 */
function mergeNodeGroups(checkedItems, options) {    
    // Return if checkedItems is empty 
    if (!checkedItems)
        return;

    // Set node group based on option parameter
    let nodeGroup;
    if (options && options.master==true)
        nodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    else if (options && options.master==false)
        nodeGroup = JSON.parse(localStorage.getItem('childNodeGroup'));
    else
        console.error('specify if master or child node group');  
    
    
    // ensure all elements of checkedItems are node Groups
    for (let element of checkedItems) {
        if (!('subNodes' in element))
            console.error('All checked elements must be group nodes')
    }


    // Get index of base Node (first element of checkedItem array) in it's original array
    const baseNodeIndex = getNodeIndex(nodeGroup, checkedItems[0]);
    
    // For each element in checked items other than first one
    for (let i=1; i<checkedItems.length; i++) {        
        // create subNode to replace the group node
        let newSubNode = {
            nodeID: checkedItems[i].nodeID,
            actionID: checkedItems[i].actionID,
            image: checkedItems[i].image,
        }
        
        // Add the subnode to the base node
        nodeGroup[baseNodeIndex].subNodes.push(newSubNode)
        
        // add the subnodes of the original array 
        for (let subNode of checkedItems[i].subNodes)
            nodeGroup[baseNodeIndex].subNodes.push(subNode);      
    }

    // Remove other node groups
    for (let i=1; i<checkedItems.length; i++) {
        removeNodeGroup(nodeGroup, checkedItems[i])
    }
    
    // update masterNodeGroup and set checked items to empty
    checkedItems=[];
    if (options && options.master==true) 
        localStorage.setItem('masterNodeGroup', JSON.stringify(nodeGroup));
    else 
        localStorage.setItem('childNodeGroup', JSON.stringify(nodeGroup));  

}

/**
 * Builds graph given masterJSON and node Groups. 
 */
function buildGraph(masterJSON, nodeGroup) {
    const scenario = masterJSON.scenario
    let newGraph = new Graph({multi: false, allowSelfLoops: true, type: 'directed'});
 
    // For each node in the scenario
    for (let i=0; i<scenario.length; i++) {
        // find the representative node in the node group array and add it as a node in the graph
        let curNode = getRepresentativeNode(nodeGroup, masterJSON.scenarioGUID+'->'+scenario[i].actionIndex)
        newGraph.mergeNode(curNode.nodeID, { type: "image", label: curNode.actionID, image: curNode.image, size: 10 });

        // If there is a node following the currently processed nodes
        if (i+1<scenario.length) {
            // add representative node of the the next node and add a edge between the two nodes
            let nextNode = getRepresentativeNode(nodeGroup, masterJSON.scenarioGUID+'->'+scenario[i+1].actionIndex)
            newGraph.mergeNode(nextNode.nodeID, { type: "image", label: nextNode.actionID, image: nextNode.image, size: 10 });
            newGraph.mergeEdge(curNode.nodeID, nextNode.nodeID);
        }
    }
    return newGraph
}


/**
 * Given master node group and childnode group, return array of nodes that have yet to be visited. Uses image diff to check
 * node similarity
 */
async function getNotVisitedNodes(masterNodeGroup, childNodeGroup, maxDiff, nodeMatchMap) {
    
    // Create a deep copy of master array 
    let toVisitArr= JSON.parse(JSON.stringify(masterNodeGroup));
    let toRemove=[];
    let matchedArr=[];
    
    // Iterate through each node of the master. If matched with a node in the child mark for removal
    for (let i=0; i<masterNodeGroup.length; i++) {
        for (let childNode of childNodeGroup) {
            let diff =  await imageDiff(masterNodeGroup[i].image, childNode.image)
            if (diff<=maxDiff) {
                toRemove.push(i);
                matchedArr.push(childNode);
            }
        }
        // add the matched nodes to the matched node map
        nodeMatchMap.set(masterNodeGroup[i], matchedArr);
        matchedArr=[];
    }
   
    // Remove all nodes that have already been visited and return
    return toVisitArr.filter((item, index) => !toRemove.includes(index));

}
/*
* Function takes in a master graph as wall as target node and returns all paths to target node
*/
function getNotVisitedPaths(masterGraph, targetNode) {
    
    // Get list of nodes in the master
    var masterNodes=[];
    masterGraph.forEachNode((node, attributes) => {
        masterNodes.push(node);
    });

    // return all simple paths
    return allSimplePaths(masterGraph, masterNodes[0], targetNode)
    
}

/**
 * This function takes in an array of unvisited nodes and displays the image
 * on the page with buttons for each node
 */
function displayUnvisitedNodes(masterGraph, masterNodeGroup, notVisitedNodes) {
    // Array to hold all checked items
    var checkedItems=[];

    // Container for all unvisited nodes
    const imageContainer = document.querySelector('.unvisited-node-display');
    imageContainer.innerHTML = ''; // Clear previous content
    
    // For each unvisited node
    for (const node of notVisitedNodes) {
        // Add each node div to the container
        imageContainer.appendChild(displayUnvisitedNode(node));
    }

    function displayUnvisitedNode(node) {
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
        checkbox.addEventListener('change', () => { let checked = checkbox.checked; updateCheckboxArray(checked, checkedItems, node);  });
        
        const imageContainerDiv = document.createElement('div');
        imageContainerDiv.className = 'image-div'
        imageContainerDiv.appendChild(imageElement);
        imageContainerDiv.appendChild(button);
        imageContainerDiv.appendChild(removeButton);
        imageContainerDiv.appendChild(checkbox);

        return imageContainerDiv
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
