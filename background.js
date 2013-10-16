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
  var pageUrl = chrome.extension.getURL('test.html');
  console.log(pageUrl);
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