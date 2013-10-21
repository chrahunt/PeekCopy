/*
 * Check for an element. If a callback is given the element is passed to the callback, otherwise the element is returned
 * TODO: Prevent infinite loop
 */
function delayedCheck(element, callback) {
  console.debug("Checking for " + element);
  var elt = document.querySelector(element);
  if (elt) {
    if (callback) {
      callback(elt);
      return;
    } else {
      return elt;
    }
  }

  setTimeout(delayedCheck(element, callback), 1000);
}

/* 
 * Add mutation observer to domElement with specified callback and config
 */
function addMutationObserver(domElement, callback, config) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(callback);
  observer.observe(domElement, config);
  return observer;
}

function checkForWrapperElement() {
  delayedCheck("div#wrapper", onWrapperElementFound);
}

// Add observer to wrapper to see changes in app window
function onWrapperElementFound(wrapperDom) {
  console.debug("Wrapper element found!");
  var config = { childList: true };

  addMutationObserver(wrapperDom, onWrapperChange, config); 
}

function onWrapperChange(mutations) {
  // div#app element loads more than once after page load
  // this ensures we get the one loaded most recently
  checkForAppElement();
}

function checkForAppElement() {
  delayedCheck("#app", onAppElementFound);
}

function onAppElementFound(appDom) {
  console.debug("App element found!");
  var config = { attributes: true };

  addMutationObserver(appDom, onAppChange, config);
}

function onAppChange(mutations) {
  console.debug("App element attributes changed!");
  
  /*
  mutations.forEach(function(mutation) {
    console.log("Change: " + mutation.attributeName + "; Target: " + mutation.target.getAttribute("class"));
  });
  */

  // Since we only have an attribute observer on this element
  classes = mutations[0].target.getAttribute("class");

  // Check if translate screen is currently active
  if (!translateScreen) {
    if (classes.indexOf("translate") > -1) {
      if (classes.indexOf("correct") === -1) {
        console.debug("On a translate screen.");
        translateScreen = true;

        // Get sessionelement and add observer to it
        var sesElt = delayedCheck("#session-element-container");
        sesObserver = onSessionElementFound(sesElt);
      }
    }
  } else {
    // For now I'm clearing out the listeners and everything prior to the next panel coming in, this may change
    if (classes.indexOf("correct") > -1) {
      console.debug("New panel coming up.");
      translateScreen = false;
      
      // Remove listeners from now non-existent elements?
      wordElements.forEach(function(wordElement) {
        wordElement.removeEventListener("mouseover", onMouseOver, false);
      });
      // Clear the wordElements array
      wordElements = [];
    } 
  }
}

// Attach a mutation observer to the session-element-container when it is found
function onSessionElementFound(sessDom) {
  console.debug("Session element found!");
  var config = { childList: true, characterData: true, subtree: true };

  var observer = addMutationObserver(sessDom, onSessionElementChange, config);
  return observer;
}

function onSessionElementChange(mutations) {
  console.debug("Change in subtree of session element.");

  if (!online) {
    var row = document.querySelector("div.challenge.row");
    if (row != null) {
      console.debug("Challenge row found.");
      // Last time commenting started here
      var firstWordElement = document.querySelector("#token_0");
      if (firstWordElement != null) {
        wordElements.push(firstWordElement);
        // Get subsequent words and add them to wordElement array
        var i = 1;
        var elt = document.querySelector("#token_" + i);
        i += 1;
        while (elt != null) {
          wordElements.push(elt);
          elt = document.querySelector("#token_" + i);
          i += 1;
        }

        // Add mouseover event listener to individual words
        wordElements.forEach(function(wordElement) {
          wordElement.addEventListener("mouseover", onMouseOver, false);
        });
        online = true;
      }
    }
  } else {
    // remove observer, our work here is done
    sesObserver.disconnect();
    online = false;
  }
}

// Take our extension-specific action when a user peeks at a word
function onMouseOver(event) {
  // Remove the onmouseover listener from the element so it can't be invoked again, which would send more data
  this.removeEventListener("mouseover", onMouseOver, false);
  var highlighted = this.textContent.trim();
  var newWord = false;
  console.log("Got: " + highlighted);

  if (this.classList.contains("highlighted-new-word")) {
    newWord = true;
  }

  // If all goes well this XPathResult will have an HTMLTableElement corresponding to the data in the popup section
  var sibling = document.evaluate("./following-sibling::span/div[@class='inner']/div[@class='content']/table", this, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  
  if (sibling) {
    var table = sibling.singleNodeValue;
    var combined = false;
    var entries = [];

    // Node actually returned from xpath
    console.debug("sibling: " + table);
    
    // Table seems to consistently have header
    if (table.tHead) {
      console.debug("Table header content: '" + table.tHead.textContent + "'");
      // Only has header content when highlighted word is meant to be taken as part of a phrase
      if (table.tHead.textContent !== '') {
        combined = true;
      }
    } else {
      console.debug("No table header found");
    }

    var headerPresent = false;
    if (combined) {
      headerPresent = true;
    }

    var firstRow = true;
    var selectedCol;
    var rows = table.rows;
    var phraseWords = [];
    var singleDefinitions = [];
    var combinedDefinitions = [];
    var definitions = [];

    // Get definition information
    for (var i = 0; i < rows.length; i++) {
      var row = rows.item(i);
      
      if (firstRow) {
        if (headerPresent) {
          var headers = row.children;
          if (headers) {
            for (var j = 0; j < headers.length; j++) {
              var header = headers.item(j);
              // For phrase text creation
              phraseWords.push(header.textContent);

              if (header.classList.contains("selected")) {
                // This is the element index we are concerned with w.r.t single-definition entries
                selectedCol = j;
              }
            }
          }
        }
        firstRow = false;
      } else {
        // TODO: identify gender element
        // Identify cases in the combined definitions when part of a definition is only concerned with a single element
        // - combined: true && child td has colspan 2 means good to go
        console.debug(rows.item(i));
        var td = row.children;

        if (td) {
          if (combined) {
            // Two possibilities: phrase definition or single word definition
            if (td.length > 1) {
              // Assumes that selectedCol it was set by this point, may not be a save assumption
              singleDefinitions.push(td.item(selectedCol).textContent.trim());
            } else if (td.length === 1) {
              combinedDefinitions.push(td.item(0).textContent.trim());
            }
          } else {
            // There should be no reason for multi-tds in a tr unless it's combined, right?
            if (td.length === 1) {
              definitions.push(td.item(0).textContent.trim());
            } else {
              console.debug("Strange td behavior: " + row.outerHTML);
            }
          }
        }
      }
    }

    if (combined) {
      var phrase = phraseWords.join(" ");
      var phraseObj = { "word": phrase, "defs": combinedDefinitions, "new": newWord };
      if (singleDefinitions.length > 0) {
        var singleObj = { "word": highlighted, "defs": singleDefinitions, "new": newWord };
        entries.push(phraseObj);
        entries.push(singleObj);
      } else {
        // I don't think the combined definition will be present along, but in case that is the case, there is this
        entries.push(phraseObj);
      }
    } else {
      var obj = { "word": highlighted, "defs": definitions, "new": newWord };
      entries.push(obj);
    }

    console.debug(JSON.stringify(entries));
    port.postMessage({ data: entries });
  } else {
    console.error("Error retrieving definition table");
  }  
}

console.debug("PeekCopy extension");

var wordElements = [];
var online = false;
var translateScreen = false;
var sesObserver = null;
var port = chrome.runtime.connect({ "name": "peeks" });

checkForWrapperElement();