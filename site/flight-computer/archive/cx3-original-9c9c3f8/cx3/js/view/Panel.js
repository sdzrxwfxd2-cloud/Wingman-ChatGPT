/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Panel.
 */

/**
 * Description of class.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam type name description.
 */
function Panel() {
  BoundUI.call(this, document.createElement("div"));
  this.ui.hide();
  this.children_ = [];
  this.title = "";
  this.subTitle = "";
}

// Panel is a subclass of BoundUI:
Panel.inheritsFrom(BoundUI);

// Standard Panel event handlers:
Panel.EVENTS = {
  DEFAULT_NAVIGATION : function(_details) {
    switch (_details["keyName"]) {
      case CONST.CX3_KEY.DOWN_ARROW:
        this.activateNextChild();
        _details["handled"] = true;
        break;

      case CONST.CX3_KEY.UP_ARROW:
        this.activatePreviousChild();
        _details["handled"] = true;
        break;
    }
  }
};

/**
 * Adds a child to this panel.
 * @tparam EventHandler _child The child to add.
 */
Panel.prototype.addChild = function(_child) {
  // Remove it from its current owner (if any):
  if (_child.owner !== undefined) {
    _child.owner.removeChild(_child);
  }

  // Add this child:
  this.children_.push(_child);
  this.ui.appendChild(_child.ui);
  _child.owner = this;
}

/**
 * Removes a child.
 * @tparam EventHandler _child The child to remove.
 */
Panel.prototype.removeChild = function(_child) {
  // Remove it form the DOM:
  try {
    this.ui.removeChild(_child.ui);
  }
  catch (err) {
  }
  
  // Remove it from this:
  while (-1 != (i = this.children_.indexOf(_child))) {
    this.children_.splice(i, 1);
  }
  _child.owner = undefined;
}

/**
 * Selects the previous child to be active.
 */
Panel.prototype.activatePreviousChild = function() {
  var i = this.children_.indexOf(this.activeChild)
  if (this.children_[i-1] !== undefined) {
    this.activeChild = this.children_[i-1];
  }
}

/**
 * Selects the next child to be active.
 */
Panel.prototype.activateNextChild = function() {
  var i = this.children_.indexOf(this.activeChild)
  if (this.children_[i+1] !== undefined) {
    this.activeChild = this.children_[i+1];
  }
}

/**
 * Gets the index of the active child.
 */
Panel.prototype.GetSelectedIndex = function() {
  if (this.activeChild !== undefined) {
    return this.activeChild;
  }
  else {
    return -1;
  }
}

/**
 * Sets the active child based on its index.
 */
Panel.prototype.SetSelected = function(index) {
  // Check that the argument is in bounds:
  if (index >= 0 && index < this.children_.length) {
    this.activeChild = this.children_[index];
  }
  else {
    this.activeChild = undefined;
  }
}

/**
 * Property for reading or selecting the active
 * Child element.
 */
Object.defineProperty(Panel.prototype, "activeChild", {
  get : function() {
    return this.__activeChild__;
  },
  set : function(_child) {
    // Do nothing if this child is aready active:
    if (this.__activeChild__ == _child) {
      return;
    }
    // Deactivate the current active child:
    if (this.__activeChild__ !== undefined) {
      this.__activeChild__.ui.removeClass("active");
      this.__activeChild__.fire("cx3-blur", {});
    }

    // Active the new child:
    this.__activeChild__ = _child;
    if (this.__activeChild__ !== undefined) {
      this.__activeChild__.fire("cx3-focus", {});
      _child.ui.addClass("active");

      // Make sure it is in view:
      Screen.scrollItemIntoScreen(this.__activeChild__.ui);
    }
  }
});
