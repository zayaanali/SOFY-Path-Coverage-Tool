import { displayMasterGroup, getNode } from "./helpers";


function makeNodeGroup(checkedItems) {
    let masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'))

    // make each of the checked nodes a node group
    for (let subNode of checkedItems) {
        // Remove the node from the subnode array
        removeSubNode(masterNodeGroup, subNode);
        
        // Create a new node to be inserted in masterNodeGroup array
        let newNode = {
            nodeID: subNode.nodeID,
            actionID: subNode.actionID,
            image: subNode.image,
            subNodes: []
        }
        
        // insert new node in the masterNodeGroup array
        masterNodeGroup.push(newNode);
    }

    // update masterNodeGroup
    localStorage.setItem('masterNodeGroup', JSON.stringify(masterNodeGroup));
    checkedItems=[];
    displayMasterGroup();   
}

function makeSubNode(checkedItems) {

    let masterNodeGroup = JSON.parse(localStorage.getItem('masterNodeGroup'));
    
    // Get index of node group adding to
    let nodeIndex = getNodeIndex(masterNodeGroup, checkedItems[0]);
    
    // add subnodes to nodeindex
    for (let i=1; i<checkedItems.length; i++) {
        removeSubNode(masterNodeGroup, checkedItems[i]);
        masterNodeGroup[nodeIndex].subNodes.push(checkedItems[i])
    }

    // update masterNodeGroup
    localStorage.setItem('masterNodeGroup', JSON.stringify(masterNodeGroup));
    checkedItems=[];
    displayMasterGroup();   
}



function removeSubNode(masterNodeGroup, subNodeToRemove) {
    for (let node of masterNodeGroup) {
        for (let i=0; i<node.subNodes.length; i++) {
            if (node.subNodes[i].nodeID==subNodeToRemove.nodeID)
                node.subNodes.splice(i, 1);
        }
    }
}

function getNodeIndex(masterNodeGroup, nodeToCheck) {
    for (let idx=0; idx<masterNodeGroup.length; idx++) {
        if (masterNodeGroup[idx].nodeID==nodeToCheck.nodeID)
            return idx;
    }
}

export { makeNodeGroup, makeSubNode }