// Appends a css class to an element if it does not exist on that element:
HTMLElement.prototype.addClass = function(cssClass) {
  var pattern = new RegExp("\\b" + cssClass + "\\b", "g");
  if (!pattern.test(this.className)) {
    this.className += " " + cssClass;
  }
}

// Removes a css class from an element and cleans up spacing:
HTMLElement.prototype.removeClass = function(cssClass) {
  var pattern = new RegExp("\\b" + cssClass + "\\b", "g");
  this.className = this.className.replace(pattern, "").replace(/ +/g, " ");
}

// Hides an element:
HTMLElement.prototype.hide = function() {
  this.addClass("hidden");
}

// Un-hides an element:
HTMLElement.prototype.show = function() {
  this.removeClass("hidden");
}

// Checks whether an element has bee hidden:
// This only checks for the "hidden" class and does not actual
// check for display:none.
HTMLElement.prototype.visible = function() {
  return !(/\bhidden\b/.test(this.className));
}
