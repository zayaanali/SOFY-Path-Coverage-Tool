// File containing helper functions

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
* Function to get the name of a node from a JSON object
*/
function getName(jsonArr, index) {
    var fullName = jsonArr.scenario[index].activityName;
    var lastPeriodIndex = fullName.lastIndexOf('.');
    if (lastPeriodIndex==-1)
        return fullName;
    else
        return fullName.substring(lastPeriodIndex + 1).trim();
}

/* 
* Function to get the image of a node from a JSON object
*/
function getImage(jsonArr, index) {
    return jsonArr.scenario[index].snapshotLocation;
}

/* 
* Function to find image associated with node
*/
function findImage(nodeArr, nodeToFind) {
    for (var node of nodeArr) {
        if (node[0]==nodeToFind)
            return node[1];
    }
}
/**
 * This function takes a master file an activity name and then returns the entire scenario data
 */
function getScenario(master, activityName) {
    for (var i=0; i<master.scenario.length; i++) {
        if (activityName==getName(master, i))
            return master.scenario[i];
    }
    
    return { data: "Node not found" };

}

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

export { isValidJSON, getName, getImage, findImage, masterJSON, getScenario }


