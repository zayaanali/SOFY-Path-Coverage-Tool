var currentMaster='';
var childList=[];
var masterJSON='';
var childJSON=[];

function masterFileSelect(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        // Save the file name as well as the file itself to global variables
        currentMaster = file.name;
        masterJSON = e.target.result;
        document.getElementById('master-display').textContent = currentMaster;
    };
    reader.readAsText(file);
   
}

function childFileSelect(evt) {    
    
    var fileInput = evt.target;
    var files = fileInput.files;
    
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        childList.push(file.name)
        var reader = new FileReader();
        reader.onload = function(e) {
            childJSON.push(e.target.result)
        };
        reader.readAsText(file);
    }
    document.getElementById('child-display').textContent = childList;
}

  
document.getElementById('master-json').addEventListener('change', masterFileSelect);

document.getElementById('child-json').addEventListener('change', childFileSelect);

