<?php
    
    // Get name of file
    $FileName=$_FILES['master-json']['name'];
    
    $location = "master-json/".$FileName;
    $TmpName=$_FILES['master-json']['tmp_name'];

    // save file to upload folder
    move_uploaded_file($TmpName, $location);

    echo("File Uploaded Successuly")
?>