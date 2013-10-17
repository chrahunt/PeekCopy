// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf('duolingo.com') > -1) {
      chrome.pageAction.show(tabId);
  }
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

// Open page when page action is clicked
chrome.pageAction.onClicked.addListener(function(disregard) {
  var pageUrl = chrome.extension.getURL('index.html');
  //console.log(pageUrl);
  chrome.tabs.query({ "url": pageUrl }, function(results) {
    var found = false;
    if (results.length > 0) {
      found = true;
      for (var i = 1; i < results.length; i++) {
        chrome.tabs.remove(results[i].id);
      }
      chrome.tabs.update(results[0].id, { "selected": true });
    }
    if (!found) {
      chrome.tabs.create({ "url": pageUrl });
    }
  });
});

// Getting words from DuoLingo page
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "peeks") {
    port.onMessage.addListener(function(msg) {
      console.log("Recieved message: " + JSON.stringify(msg.data));
      // Create array with word
      var newWords = msg.data;

      // Add existing words to store
      // Is there a possibility that this will not fetch?
      store.get("words", function(result) {
        console.debug("Words entered: " + newWords);
        if (result.words) {
          var words = result.words;
          console.debug("Words retrieved: " + JSON.stringify(words));
        } else {
          var words = [];
          console.debug("No words retrieved");
        }
        words = words.concat(newWords);
        console.debug("Result of concatenation: " + JSON.stringify(words));

        store.set({ "words": words });
      });
    });
  }
});

var store = chrome.storage.local;