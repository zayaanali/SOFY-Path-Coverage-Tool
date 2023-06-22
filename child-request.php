<?php
    
    // Get name of file
    $FileName=$_FILES['child-json']['name'];
    
    $location = "child-json/".$FileName;
    $TmpName=$_FILES['child-json']['tmp_name'];

    // save file to upload folder
    move_uploaded_file($TmpName, $location);

    echo("File Uploaded Successuly")
?>