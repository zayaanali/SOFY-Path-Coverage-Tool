import { createPathJSON, masterJSON, imageDiff, addNode, removeEdge, updateCheckboxArray, getNodeIndex, removeSubNode, removeNodeGroup, getRepresentativeNode } from './helpers.js';
import Graph, { DirectedGraph } from 'graphology';
import { allSimplePaths } from 'graphology-simple-path';
import { isValidJSON } from './tools.js';


/**
 * This function parses a single uploaded template and returns an object containing all information needing to be retained from
 * the file. This function is used to parse the template and store it in local storage
 * 
 * @param {*} jsonStr - String containing template that will be parse
 * @returns template representing object
 */
function parseTemplate(jsonStr) {
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        console.error("Invalid JSON");

    // parse the JSON to get it from string to JSON object    
    let jsonArr = JSON.parse(jsonStr);

    // Create the object representing the template
    let nodeObject = {
        scenarioGUID: jsonArr.scenarioGUID,
        scenario: []
    }
    
    // Iterate through each node in the scenario and add it to an array
    for (let node of jsonArr.scenario) {
        // fill node information in object
        let scenarioObject = {
            actionIndex: node.actionIndex,
            snapshotLocation: node.snapshotLocation
        }
        nodeObject.scenario.push(scenarioObject); 
    }
    // return object containing all template file information
    return nodeObject;
}


/*
* Takes JSON string and builds array of node groups based on it. Node Groups passed as parameter so that node groups 
* can be added onto when processing multiple files
*/
async function parseJSON(jsonStr, nodeGroups, options) {
    let templateCounter=0;
    let templateArr;
    
    // Check if processing child or master template
    if (options && options.child==true)
        templateArr = JSON.parse(localStorage.getItem("childTemplateArray"));
    else
        templateArr = JSON.parse(localStorage.getItem("masterTemplateArray"));
    
    // Check if the JSON string is a valid JSON
    if (!isValidJSON(jsonStr))
        console.error("Invalid JSON");
    
    // parse the JSON to get it from string to JSON object    
    let jsonArr = JSON.parse(jsonStr);

    // Get number of nodes in the JSON
    const arrLength = jsonArr.scenario.length;
    let processedNodes= new Set();

    // Building concise node array (placing identical screen as subnodes). Add each node in JSON array
    for (let i=0; i<arrLength;i++) {
        // if the action is template, insert node from template
        if (jsonArr.scenario[i].action == 'TEMPLATE') {
            // make sure template counter not out of bounds
            if (templateCounter>=templateArr.length)
                console.error('template not found for action index: ', i);
            
            // add each node in the template to the node group
            console.log(templateCounter, templateArr.length)
            console.log(templateArr[templateCounter].scenario.length)
            // add each node in the template scenario to the node group
            for (let j=0; j<templateArr[templateCounter].scenario.length; j++) {
                j= await addNode(templateArr[templateCounter], j, templateArr[templateCounter].scenario.length, nodeGroups, processedNodes);
            }
            templateCounter++;
        } else {
            //  action is not a template
            i = await addNode(jsonArr, i, arrLength, nodeGroups, processedNodes); // adds the node of the given index to the array of representative nodes
        }
        
        
    }
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
    txt.textContent = "Node Group " + node.actionID;
    
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
 * Builds graph given masterJSON and nodeGroup. Edges are placed between node in the order they appear in the scenario
 * @param {*} masterJSON - JSON object of master template
 * @param {*} nodeGroup - Array of node groups (representative node + subnodes)
 * @returns Graphology graph object
 * 
 * Edges are single directional - bidirectional edges are not allowed
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
            if (!newGraph.hasEdge(nextNode.nodeID, curNode.nodeID))
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
 * Function takes in a master graph as wall as target node and returns all paths to target node using allSimplePaths 
 * Graphology function
*/
function getNotVisitedPaths(masterGraph, targetNode) {
    // Get list of nodes in the master
    const masterNodes = masterGraph.nodes();
    // return all simple paths
    return allSimplePaths(masterGraph, masterNodes[0], targetNode)
    
}

/**
 * This function takes in an array of unvisited nodes and displays the image
 * on the page with buttons for each node
 */
function displayUnvisitedNodes() {
    
    // Get master graph, node group, and unvisited nodes from local storage
    const masterGraph = Graph.from(JSON.parse(localStorage.getItem("masterGraph")));
    const masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    const notVisitedNodes = JSON.parse(localStorage.getItem('notVisitedNodes'));
    
    // Array to hold all checked items
    let checkedItems=[];

    // Clear container for unvisited nodes
    const container2 = document.getElementById('unvisited-node-match');
    container2.innerHTML = ''; // Clear previous content

    // Container for all unvisited nodes
    const imageContainer = document.getElementById('unvisited-node-display');
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
        const imageContainer = document.getElementById('unvisited-node-display');
        imageContainer.innerHTML = ''; // Clear previous content
        displayImages(); // Display the updated images
    }
}

/**
 * This function takes in a masterGraph, masterNodeGroup and target node
 * Display buttons for each path to the target node, when clicked will display the path
 */
function displayPathButtons(masterGraph, masterNodeGroup, target) {

    // Get all not visited paths to target node
    const notVisitedPaths = getNotVisitedPaths(masterGraph, target, { maxDepth: 20 });

    // Get the button container element
    const container = document.getElementById("paths-selection");
    container.innerHTML='';

    // Loop through the paths array
    for (let i = 0; i < notVisitedPaths.length; i++) {
        let path = notVisitedPaths[i];
        // Create a button for the current path
        let pathButton = document.createElement("button");
        pathButton.textContent = 'Path '+(i+1); // Display the path name

        // Add an event listener to the path button
        pathButton.addEventListener("click", displayPath.bind(null, masterGraph, masterNodeGroup, path));
        container.appendChild(pathButton);
    }


}

/**
 * Given path, displays path on page
 * Path given in array of nodeIDs so need to get the nodes from masterNodeGroup first
 * @param {*} masterGraph 
 * @param {*} masterNodeGroup 
 * @param {*} path 
 */
function displayPath(masterGraph, masterNodeGroup, path) {
    
    let pathArr=[];
    
    // Create path Arr consisting of node objects instead of nodeIDs
    for (let id of path) {
        let node = masterNodeGroup.find(node => node.nodeID == id);
        pathArr.push(node);
    }
    
    // Container for displaying paths
    const imageContainer = document.getElementById('paths-display');
    imageContainer.innerHTML='';
    
    // For each node in the path
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

        // create text signifying node group id
        const txt = document.createElement('p');
        txt.className = 'group-text'
        txt.textContent = "Node Group " + pathArr[i].actionID;

        // Append buttons to button div
        buttonDiv.appendChild(removeLeft);
        buttonDiv.appendChild(removeRight);

        // append elements to imagediv
        imageDiv.appendChild(txt);
        imageDiv.appendChild(imgElement);
        imageDiv.appendChild(buttonDiv);

        imageContainer.appendChild(imageDiv);
    }

    // Create button to download path
    let buttonContainer = document.getElementById('path-download');
    buttonContainer.innerHTML='';
    let button = document.createElement('button');
    button.textContent = "Download Path";
    button.addEventListener("click", downloadPath.bind(null, pathArr));
    buttonContainer.appendChild(button);

}

/**
 * Given a path (array of nodeIDs) create a SOFY JSON for running the path in SOFY engine
 * @param {*} path 
 */
function downloadPath(path) {
    // Get master JSON
    const master = JSON.parse(masterJSON.getValue());
    
    // Get path JSON
    const newJSON = createPathJSON(master, path);
    
    // Log to console (can download/do whatever with it here)
    console.log(newJSON)
}


export { buildGraph, getNotVisitedPaths, parseJSON, createPathJSON, getNotVisitedNodes, makeNodeGroup, makeSubNode };
export { displayPath, displayUnvisitedNodes, getNodeGroupRow, mergeNodeGroups, parseTemplate }
