function checkForWrapperElement() {
  console.log("Checking for wrapper element");
  var wrapper = document.querySelector("div#wrapper");
  if (wrapper) {
    // Add mutation observer to app element
    onWrapperElementFound(wrapper);
    return;
  }

  setTimeout(checkForAppElement, 750);
}

// Add observer to wrapper to see changes in app window
function onWrapperElementFound(wrapperDom) {
  console.log("Wrapper element found!");
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onWrapperChange);
  var config = { childList: true };
  observer.observe(wrapperDom, config); 
}

function onWrapperChange(mutations) {
  mutations.forEach(function(mutation) {
    console.log(mutation.target);
    console.log(mutation.type);
  });
  // App element loads more than once after page load, this ensures we get the one loaded last
  checkForAppElement();
}

function checkForAppElement() {
  console.log("Checking for app element");
  var app = document.querySelector("#app");
  if (app) {
    onAppElementFound(app);
    return;
  }

  setTimeout(checkForAppElement, 1000);
}

function onAppElementFound(appDom) {
  console.log("App element found!");
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onAppChange);
  var config = { attributes: true };
  observer.observe(appDom, config); 
}

function onAppChange(mutations) {
  console.log("App Changed!");
  mutations.forEach(function(mutation) {
    console.log("Change: " + mutation.attributeName + "; Target: " + mutation.target.getAttribute("class"));
  });

  classes = mutations[0].target.getAttribute("class")
}

// Check for the session element since it is loaded into the DOM on a delay
function checkForSessionElement() {
  console.log("Checking");
  var app = document.querySelector("#app");
  if (app) {
    var sessionContainer = document.querySelector("#session-element-container");
    if (sessionContainer) {
      onSessionElementFound(sessionContainer);
      return;
    }
  }

  setTimeout(checkForSessionElement, 1000);
}

// Attach a mutation observer to the session-element-container when it is found
function onSessionElementFound(sessDom) {
  console.log("Session element found!");
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(onMutationObserver);
  var config = { attributes: true, childList: true, characterData: true, subtree: true };
  observer.observe(sessDom, config); 
}

function onMutationObserver(mutations) {
  console.log("Something Changed!");
  
  mutations.forEach(function(mutation) {
    console.log(mutation.target);
    console.log(mutation.type);
  });

  if (row == null) {
    console.log("Row null");
    
    row = document.querySelector("div.challenge.row");
    if (row != null) {
      console.log("Row not null!");
      // Last time commenting started here
      if (!online) {
        firstWordElement = document.querySelector("#token_0");
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

        }
      } else {
        var oldFirstWordElement = firstWordElement;
        firstWordElement = document.querySelector("#token_0");
        // Assumption here is that they will be the same until the panel changes
        if ((firstWordElement == null) || (oldFirstWordElement != firstWordElement)) {
          console.log("New panel!");
          online = false;
          firstWordElement = null;
          // Remove listeners from now non-existent elements?
          wordElements.forEach(function(wordElement) {
            wordElement.removeEventListener("mouseover", onMouseOver, false);
          });
          // Clear the wordElements array
          wordElements = [];
        }
      }
      // and ended here
    }
  }
}

// Take our extension-specific action when a user peeks at a word
function onMouseOver(event) {
  // Remove the onmouseover listener from the element so it can't be invoked again, which would send more data
  this.removeEventListener("mouseover", onMouseOver, false);
  console.log(this.textContent);
  // Should get the child elements of this element and parse them to get the relevant information
  // Relevant informationwill be the word that was hovered over and anything that came up in the table when the word was peeked at

}

console.log("Testing");

var row = null;
var firstWordElement = null;
var wordElements = [];
var online = false;
var translate = false;

checkForWrapperElement();

//checkForSessionElement();