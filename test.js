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
  // TODO: if word is part of a phrase, also get rid of the even listener for the other word that makes up part of the phrase?
  this.removeEventListener("mouseover", onMouseOver, false);
  console.log(this.textContent);
  // Should get the child elements of this element and parse them to get the relevant information
  // Relevant informationwill be the word that was hovered over and anything that came up in the table when the word was peeked at
}

console.debug("Testing PeekCopy extension");

var wordElements = [];
var online = false;
var translateScreen = false;
var sesObserver = null;

checkForWrapperElement();