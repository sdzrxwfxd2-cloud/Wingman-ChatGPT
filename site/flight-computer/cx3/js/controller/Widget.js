
/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Widget.
 */

/**
 * Description of class.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam type name description.
 */
function Widget() {
    // Create a dummy div for inheritance to work:
    var uiElement = document.createElement("div");
    // Get the template, but don't freak out if it doesn't exist yet:
    try {
        uiElement = document.querySelector("#templates>.widget").cloneNode(true);
    } catch (e) { }
    BoundUI.call(this, uiElement);
}
// Widget is a subclass of BoundUI:
Widget.inheritsFrom(BoundUI);

Widget.allCSSIcons = ["check", "equals", "global", "question"];
Widget.iconRegex = new RegExp("(\\b" + Widget.allCSSIcons.join("\\b|\\b") + "\\b)");

Object.defineProperty(Widget.prototype, "fieldName", {
    get: function () {
        return this.ui.getElementsByClassName("fieldname")[0];
    }
});

Object.defineProperty(Widget.prototype, "value", {
    get: function () {
        return this.ui.getElementsByClassName("value")[0];
    }
});

Object.defineProperty(Widget.prototype, "unit", {
    get: function () {
        return this.ui.getElementsByClassName("unit")[0];
    }
});

Object.defineProperty(Widget.prototype, "icon", {
    get: function () {
        return Widget.iconRegex.exec(this.ui.className);
    },
    set: function (_icon) {
        for (var i in Widget.allCSSIcons) {
            this.ui.removeClass(Widget.allCSSIcons[i]);
        }
        // Make sure this is a valid icon name:
        if (-1 != Widget.allCSSIcons.indexOf(_icon)) {
            this.ui.addClass(_icon);
        }
    }
});
