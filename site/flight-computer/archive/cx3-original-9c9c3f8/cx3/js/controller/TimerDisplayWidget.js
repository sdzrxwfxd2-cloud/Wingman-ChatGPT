/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for TimerDisplayWidget.
 */

/**
 * Description of class.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam type name description.
 */
function TimerDisplayWidget() {
    // Create a dummy div for inheritance to work:
    var uiElement = document.createElement("div");
    // Get the template, but don't freak out if it doesn't exist yet:
    try {
        uiElement = document.querySelector("#templates>.cx3-timer").cloneNode(true);
    } catch (e) { }
    BoundUI.call(this, uiElement);
}
// TimerDisplayWidget is a subclass of BoundUI:
TimerDisplayWidget.inheritsFrom(BoundUI);

Object.defineProperty(TimerDisplayWidget.prototype, "hours", {
    get: function () {
        return this.ui.getElementsByClassName("hours");
    }
});

Object.defineProperty(TimerDisplayWidget.prototype, "minutes", {
    get: function () {
        return this.ui.getElementsByClassName("minutes");
    }
});

Object.defineProperty(TimerDisplayWidget.prototype, "seconds", {
    get: function () {
        return this.ui.getElementsByClassName("seconds");
    }
});

Object.defineProperty(TimerDisplayWidget.prototype, "sign", {
    get: function () {
        return this.ui.getElementsByClassName("sign")[0];
    }
});

TimerDisplayWidget.prototype.setDisplayFromText = function (_text) {
    //_text is an array of 6 characters.
    var uiPart = this.hours;
    uiPart[0].innerText = _text.charAt(0);
    uiPart[0].textContent = _text.charAt(0);
    uiPart[1].innerText = _text.charAt(1);
    uiPart[1].textContent = _text.charAt(1);
    var uiPart = this.minutes;
    uiPart[0].innerText = _text.charAt(2);
    uiPart[0].textContent = _text.charAt(2);
    uiPart[1].innerText = _text.charAt(3);
    uiPart[1].textContent = _text.charAt(3);
    var uiPart = this.seconds;
    uiPart[0].innerText = _text.charAt(4);
    uiPart[0].textContent = _text.charAt(4);
    uiPart[1].innerText = _text.charAt(5);
    uiPart[1].textContent = _text.charAt(5);
}

TimerDisplayWidget.prototype.setDisplay = function (_neg, _h, _m, _s) {
    this.setDisplaySign(_neg);
    this.setDisplayHours(_h);
    this.setDisplayMinutes(_m);
    this.setDisplaySeconds(_s);
}

TimerDisplayWidget.prototype.setDisplayTime = function (_time) {
    if (_time < 0) {
        var neg = true;
        _time = Math.abs(_time);
    }
    var h = Math.floor(_time / 3600);
    _time -= h * 3600;
    var m = Math.floor(_time / 60);
    var s = Math.floor(_time - (m * 60));
    this.setDisplay(neg, h, m, s);
}

TimerDisplayWidget.prototype.setDisplaySign = function (_neg) {
    // Make the text red if it has expired; also, set the negative sign:
    if (_neg) {
        this.ui.addClass("expired");
        this.sign.innerText = "-";
        this.sign.textContent = "-";
    }
    else {
        this.ui.removeClass("expired");
        this.sign.innerText = "";
        this.sign.textContent = "";
    }
}

TimerDisplayWidget.prototype.setDisplayHours = function (_h) {
    // Set the hours:
    if (_h > 99) {
        _h = 99;
    }
    else if (_h < 0) {
        _h = 0;
    }
    var temp = ("00" + _h.toFixed(0)).slice(-2);
    var uiPart = this.hours;
    uiPart[0].innerText = temp[0];
    uiPart[0].textContent = temp[0];
    uiPart[1].innerText = temp[1];
    uiPart[1].textContent = temp[1];
}

TimerDisplayWidget.prototype.setDisplayMinutes = function (_m) {
    // Set the minutes:
    if (_m > 99) {
        _m = 99;
    }
    else if (_m < 0) {
        _m = 0;
    }
    var temp = ("00" + _m.toFixed(0)).slice(-2);
    var uiPart = this.minutes;
    uiPart[0].innerText = temp[0];
    uiPart[0].textContent = temp[0];
    uiPart[1].innerText = temp[1];
    uiPart[1].textContent = temp[1];
}
TimerDisplayWidget.prototype.setDisplaySeconds = function (_s) {
    // Set the seconds:
    if (_s > 99) {
        _s = 99;
    }
    else if (_s < 0) {
        _s = 0;
    }
    var temp = ("00" + _s.toFixed(0)).slice(-2);
    var uiPart = this.seconds;
    uiPart[0].innerText = temp[0];
    uiPart[0].textContent = temp[0];
    uiPart[1].innerText = temp[1];
    uiPart[1].textContent = temp[1];
}
