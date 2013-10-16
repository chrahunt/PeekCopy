// Populate the text area with the relevant data
function initialDataPopulation(items) {
  console.log("Data found: " + JSON.stringify(items));
  var data = items["words"];
  var entries = parseWords(data);
  var textArea = document.querySelector("#wordSpace");
  textArea.textContent = entries.join("\n");
}

// Handle updates to stored data, updating anything as-needed
function dataUpdateHandler(items) {
  console.log("Data updating: " + JSON.stringify(items));
  if (items["words"]) {
    var data = items["words"].newValue;
    var entries = parseWords(data);
    var textArea = document.querySelector("#wordSpace");
    textArea.textContent = entries.join("\n");
  }
  // Handle settings updates
}

// Clear all storage
// TODO: Make this clear the words only
function clearStorage(elt) {
  // To clear storage and probably update panel
  chrome.storage.local.clear();
}

// Parse values to put to screen from data
function parseWords(words) {
  var entries = [];
  // Placeholder configuration
  var defsPerEntry = 2;
  var defSeparator = "/";
  var wordDefSeparator = ",";

  for (var i = 0; i < words.length; i++) {
    // This is where I would change behavior based on settings
    // I kind of skimped on testing assumptions here
    // TODO: Fix above
    var entry = words[i];
    var word = entry.word;
    if (defsPerEntry > (entry.defs.size - 1)) {
      var defs = entry.defs;
    } else {
      var defs = entry.defs.slice(defsPerEntry - 1);
    }
    var defString = defs.join(defSeparator);
    var entryString = word + wordDefSeparator + defString;
    entries.push(entryString);
    console.log(entryString);
  }
  return entries;
}

// Setting the data initially
var data = chrome.storage.local.get("words", initialDataPopulation);

// Setting listener so that the element gets updated when the storage area changes
chrome.storage.onChanged.addListener(dataUpdateHandler);

var button = document.querySelector("#clear")
button.addEventListener("click", clearStorage);