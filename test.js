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

function checkForWrapperElement() {
  delayedCheck("div#wrapper", onWrapperElementFound);
}

// Add observer to wrapper to see changes in app window
function onWrapperElementFound(wrapperDom) {
  console.debug("Wrapper element found!");
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onWrapperChange);
  var config = { childList: true };
  observer.observe(wrapperDom, config); 
}

function onWrapperChange(mutations) {
  // div#pp element loads more than once after page load, this ensures we get the one loaded most recently
  checkForAppElement();
}

function checkForAppElement() {
  delayedCheck("#app", onAppElementFound);
}

function onAppElementFound(appDom) {
  console.debug("App element found!");
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onAppChange);
  var config = { attributes: true };
  observer.observe(appDom, config); 
}

function onAppChange(mutations) {
  console.debug("App element attributes changed!");
  mutations.forEach(function(mutation) {
    //console.log("Change: " + mutation.attributeName + "; Target: " + mutation.target.getAttribute("class"));
  });

  classes = mutations[0].target.getAttribute("class");
  // Check if translate screen

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
      // For not 
      // clear out the rest of
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
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onSessionElementChange);
  var config = { childList: true, characterData: true, subtree: true };
  observer.observe(sessDom, config);
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
  var highlighted = this.textContent;

  console.log("Got: " + highlighted);

  // If all goes well this XPathResult will have an HTMLTableElement corresponding to the data in the popup section
  var sibling = document.evaluate("./following-sibling::span/div[@class='inner']/div[@class='content']/table", this, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  
  //console.log("result type: " + sibling.resultType);
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

    for (var i = 0; i < rows.length; i++) {
      // Get specific row that we're looking at
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
        // Rule out the possibility of conjugate or explain buttons - nevermind, these are in a separate div
        // identify gender element
        // Identify cases in the combined definitions when part of a definition is only concerned with a single element
        // - combined: true && child td has colspan 2 means good to go
        console.debug(rows.item(i));
        var td = row.children;

        if (td) {
          if (combined) {
            // two possibilities, phrase definition or singular definition
            if (td.length > 1) {
              // Assumes that selectedCol it was set by this point, may not be a save assumption
              singleDefinitions.push(td.item(selectedCol).textContent);
            } else if (td.length === 1) {
              combinedDefinitions.push(td.item(0).textContent);
            }
          } else {
            // There should be no reason for multi-tds in a tr unless it's combined, right?
            if (td.length === 1) {
              definitions.push(td.item(0).textContent);
            } else {
              console.debug("Strange td behavior: " + row.outerHTML);
            }
          }
        }
      }
    }

    if (combined) {
      var phrase = phraseWords.join(" ");
      var phraseObj = { "word": phrase, "defs": combinedDefinitions };
      if (singleDefinitions.length > 0) {
        var singleObj = { "word": highlighted, "defs": singleDefinitions };
        entries.push(phraseObj);
        entries.push(singleObj);
      } else {
        // I don't think there is ever only just the combined definition, but in case that is the case, there is this
        entries.push(phraseObj);
      }
    } else {
      var obj = { "word": highlighted, "defs": definitions };
      entries.push(obj);
    }

    console.debug(JSON.stringify(entries));
    port.postMessage({ data: entries });
  } else {
    console.error("Error retrieving definition table");
  }
  
  // Should get the child elements of this element and parse them to get the relevant information
  // Relevant informationwill be the word that was hovered over and anything that came up in the table when the word was peeked at

  // Send words to extension
  
}

console.debug("Testing PeekCopy extension");

var wordElements = [];
var online = false;
var translateScreen = false;
var sesObserver = null;
var port = chrome.runtime.connect({ "name": "peeks" });

checkForWrapperElement();