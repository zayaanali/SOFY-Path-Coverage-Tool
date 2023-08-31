

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



export { isValidJSON, doesNodeIdExist }