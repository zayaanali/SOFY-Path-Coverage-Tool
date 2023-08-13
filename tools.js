

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

export { isValidJSON }