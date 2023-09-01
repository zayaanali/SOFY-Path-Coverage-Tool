import { imageDiff } from "./tools";
var allowedDiff = 0.005

/**
 * Given a node Group (group nodes + subnodes) find the representative node given a node ID
 */
function getRepresentativeNode(nodeGroup, findIDX) {
    // Go for each node in the node group
    for (const node of nodeGroup) {
        // if is the node looking for then return
        if (node.nodeID==findIDX)
            return node;

        // scan the subnode array, return if is the node looking for
        for (const subNode of node.subNodes) {
            if (subNode.nodeID==findIDX)
                return node;
        }
    }
}


/* 
* Create object with all required information from JSON
*/
function getNode(jsonArr, idx) {
    let node = {
        nodeID: jsonArr.scenarioGUID+'->'+jsonArr.scenario[idx].actionIndex,
        actionID: parseInt(jsonArr.scenario[idx].actionIndex)+1,
        image: jsonArr.scenario[idx].snapshotLocation,
        subNodes: []
    }

    return node;
}

/**
 * Get the subnode information from the JSON and create object
 * @param {*} jsonArr 
 * @param {*} idx 
 * @returns 
 */
function getSubNode(jsonArr, idx) {
    let node = {
        nodeID: jsonArr.scenarioGUID+'->'+jsonArr.scenario[idx].actionIndex,
        actionID: parseInt(jsonArr.scenario[idx].actionIndex)+1,
        image: jsonArr.scenario[idx].snapshotLocation,
    }

    return node;
}


/**
 * This function helps maintain array of checked items
 * 
 * @param {*} checked - true if checkbox is checked, false if unchecked
 * @param {*} checkedItems - array of checked items
 * @param {*} node - currently processed node
 */
function updateCheckboxArray(checked, checkedItems, node) {
    // If checked, then add to array
    if (checked) {
        checkedItems.push(node);
    } else { // if not then remove from array
        const indexToRemove = checkedItems.findIndex(item => item.nodeID === node.nodeID);
        if (indexToRemove !== -1)
            checkedItems.splice(indexToRemove, 1);
    }
}


/**
 * Function returns the scenario object given the master and node. Used to build path JSON
 */
function getScenario(master, node) {

    for (let scenario of master.scenario) {
        let id= parseInt(scenario.actionIndex)+1;

        if (id==node.actionID)
            return scenario
    }
}


/**
 * Retainer function for masterJSON. Allows for the masterJSON to be stored (too large for local storage)
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
 * 
 * finds whether a node exists in the given array by using image matching
 */
async function doesNodeExist(nodeArr, img) {
    // iterate through the node array
    for (let i=0; i<nodeArr.length; i++) {
        // calculate the difference between the current image and the given image
        let diff = await imageDiff(nodeArr[i].image, img);
        // if the difference is less than allowedDiff then return the index of the matching image
        if (diff<=allowedDiff)
            return i;    
    }
    // if no matching images found return -1
    return -1;
}

/**
 * Addres the currently processed node to node group. If image match exists then add as subnode, else add as representative node
 * 
 * @param {*} jsonArr 
 * @param {*} i 
 * @param {*} arrLength 
 * @param {*} nodeArr 
 * @param {*} processedNodes 
 * @returns 
 */
async function addNode(jsonArr, i, arrLength, nodeArr, processedNodes) {
    if (processedNodes.has(jsonArr.scenarioGUID+'->'+jsonArr.scenario[i].actionIndex))
        return;
    
    // Get the image of the current node
     let curNodeImage = jsonArr.scenario[i].snapshotLocation;
        
     // get the index of the node if it already exists in the array
    let nodeIndex = await doesNodeExist(nodeArr, curNodeImage);
     
     let tempNode;
    // if already exists in array
    if (nodeIndex!=-1) {
        tempNode = getSubNode(jsonArr, i)
        nodeArr[nodeIndex].subNodes.push(tempNode);
        processedNodes.add(tempNode.nodeID)
    } else {
        tempNode=getNode(jsonArr, i)
        nodeArr.push(tempNode);
        processedNodes.add(tempNode.nodeID)
    }
         
     
     let nextIndex = i+1;
     let done = false;
     
     // for all next nodes check if they are subnodes
     while (!done && nextIndex<arrLength) {
         
        // Get the next image and compute difference between current and next image
        if (jsonArr.scenario[nextIndex].action=="TEMPLATE")
            return i;
        let nextImage = jsonArr.scenario[nextIndex].snapshotLocation;
        let diff = await imageDiff(curNodeImage, nextImage);

        // if the difference is less than 5% they are subnodes
        if (diff<=allowedDiff) {
            // check if the node that compared to is a subnode or representative node
            if (nodeIndex!=-1) {// subnode 
                tempNode = getSubNode(jsonArr, nextIndex);
                nodeArr[nodeIndex].subNodes.push(tempNode); // use the index found previously
                processedNodes.add(tempNode.nodeID)
            } else // representative node
                tempNode = getNode(jsonArr, nextIndex);
                nodeArr[nodeArr.length-1].subNodes.push(tempNode); // use the index of the node that was just added to the array
                processedNodes.add(tempNode.nodeID);
                nextIndex++; // increment the temp index
            } else { // difference is more than 5% so don't do anything
                done=true;
            //  i = nextIndex-1; // will be incremented by the forloop
            return nextIndex-1;
        }
     }
     return i;    
}

/**
 * Remove edge from the graph
 * @param {*} masterGraph 
 * @param {*} startNode 
 * @param {*} endNode 
 */
function removeEdge(masterGraph, startNode, endNode) {
    if (masterGraph.hasEdge(startNode.nodeID, endNode.nodeID))
        masterGraph.dropEdge(startNode.nodeID, endNode.nodeID)
}



/**
 * Get the index of the node in the node group if it exists (given node object)
 * @param {*} nodeGroup 
 * @param {*} nodeToCheck 
 * @returns 
 */
function getNodeIndex(nodeGroup, nodeToCheck) {
    for (let idx=0; idx<nodeGroup.length; idx++) {
        if (nodeGroup[idx].nodeID==nodeToCheck.nodeID)
            return idx;
    }
    return -1
}

/**
 * Remove subNode from the masterNodeGroup
 * @param {*} masterNodeGroup 
 * @param {*} subNodeToRemove 
 */
function removeSubNode(masterNodeGroup, subNodeToRemove) {
    for (let node of masterNodeGroup) {
        for (let i=0; i<node.subNodes.length; i++) {
            if (node.subNodes[i].nodeID==subNodeToRemove.nodeID)
                node.subNodes.splice(i, 1);
        }
    }
}

/**
 * Remove master node from the masterNodeGroup
 * @param {*} nodeGroup 
 * @param {*} nodeToRemove 
 */
function removeNodeGroup(nodeGroup, nodeToRemove) {
    const nodeIndex = getNodeIndex(nodeGroup, nodeToRemove);
    nodeGroup.splice(nodeIndex, 1);
}

/*
 * Given master file and path, create a SOFY compatible JSON file for the path.
 * This is done by copying the master file and then modifying the scenario to only include the nodes in the path.
 */
function createPathJSON(master, path) {
    
    // create a deep copy of the master to modify
    const newJSON = JSON.parse(JSON.stringify(master));
    
    // set the scenario to empty
    newJSON.scenario=[];

    // for each node on the path, add the node to the scenario
    for (let node of path)
        newJSON.scenario.push(getScenario(master, node));
    
    return newJSON
}

export { masterJSON, getScenario, getNode, imageDiff, getSubNode, doesNodeExist, addNode, removeEdge, updateCheckboxArray, getNodeIndex, removeSubNode, removeNodeGroup }
export { getRepresentativeNode, createPathJSON }

