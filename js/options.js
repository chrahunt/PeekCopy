function saveOptions(e) {
  var form = document.querySelector("#optionsForm");
  var error = false;

  var options = getFormValues(form);

  if (isNaN(options.defN)) {
    console.debug("Not a number: " + options.defN);
    var formGroup = form.defN.parentElement.parentElement;
    formGroup.classList.add("has-error");
    form.defN.addEventListener("focus", removeError);
    error = true;
  }
  
  if (!error) {
    chrome.storage.local.set({"options": options});
  }
}

function getFormValues(form) {
  var options = {
    defN: form.defN.value,
    defSep: form.defSep.value,
    separator: form.separator.value,
    newWords: form.newWords.checked,
    lowercase: form.lowercase.checked
  };
  return options;
}

function removeError() {
  this.parentElement.parentElement.classList.remove("has-error");
}

// Load options from storage, or default
function loadOptions(data) {
  if (data["options"]) {
    console.debug("Options loaded");
    var options = data["options"];
    var form = document.querySelector("#optionsForm");
    form.defN.value = options.defN;
    form.defSep.value = options.defSep;
    form.separator.value = options.separator;
    form.newWords.checked = options.newWords;
    form.lowercase.checked = options.lowercase;
  } else {
    console.error("No options found!");
  }
}

chrome.storage.local.get("options", loadOptions);

var saveButton = document.querySelector("#saveOptions");
saveButton.addEventListener("click", saveOptions);