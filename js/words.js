// Populate the text area with the relevant data
function dataPopulation(items) {
  console.log("Data found: " + JSON.stringify(items));
  var data = items["words"];
  options = items["options"];
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
  } else if (items["options"]) {
    // Extra call probably not needed
    chrome.storage.local.get(["words", "options"], dataPopulation);
  }
}

// Clear all storage
// TODO: Make this clear the words only
function clearStorage(elt) {
  // To clear storage and probably update panel
  chrome.storage.local.remove("words");
}

// Parse values to put to screen from data
function parseWords(words) {
  var entries = [];
  // Placeholder configuration
  var defsPerEntry = options.defN;
  var defSeparator = options.defSep;
  var wordDefSeparator = options.separator;
  var newWords = options.newWords;
  var lowercase = options.lowercase;

  if (words) {
    for (var i = 0; i < words.length; i++) {
      // I kind of skimped on testing assumptions here
      // TODO: Fix above
      var entry = words[i];
      if (entry["new"] && !newWords) {
        continue;
      }

      var word = entry.word;
      if (defsPerEntry > (entry.defs.size - 1)) {
        var defs = entry.defs;
      } else {
        var defs = entry.defs.slice(0, defsPerEntry);
      }
      var defString = defs.join(defSeparator);
      var entryString = word + wordDefSeparator + defString;
      if (lowercase) {
        entryString = entryString.toLowerCase();
      }
      entries.push(entryString);
      console.log(entryString);
    }
  }
  
  return entries;
}

// Setting the data initially
var options = {};
var data = chrome.storage.local.get(["words", "options"], dataPopulation);

// Setting listener so that the element gets updated when the storage area changes
chrome.storage.onChanged.addListener(dataUpdateHandler);

var button = document.querySelector("#clear")
button.addEventListener("click", clearStorage);