function updateData(items) {
  console.log("Data found: " + JSON.stringify(items));
  var foundWords = items["words"];
  var elt = document.querySelector("#words");
  elt.textContent = JSON.stringify(foundWords);
}

function updateData2(items) {
  // TODO: Make this more for the elements in the storage that I care about rather than something 
  // that happens on any update.
  console.log("Data updating: " + JSON.stringify(items));
  var foundWords = items["words"].newValue;
  var elt = document.querySelector("#words");
  elt.textContent = JSON.stringify(foundWords);
}

function clearStorage(elt) {
  // To clear storage and probably update panel
  chrome.storage.local.clear();
}

// Setting the data initially
var data = chrome.storage.local.get("words", updateData);

// Setting listener so that the element gets updated when the storage area changes
chrome.storage.onChanged.addListener(updateData2);

var button = document.querySelector("#clear")
button.addEventListener("click", clearStorage);