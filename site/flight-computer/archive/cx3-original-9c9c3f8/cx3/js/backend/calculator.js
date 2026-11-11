// Fix for old browsers:
if (!window.console) { window.console = { log: function () { } }; }

// Global function to get the stack trace:
function stackTrace(_tag) {
    (typeof _tag == "undefined") ? _tag = "" : _tag = " - " + _tag;
    return (new Error("Stack Trace" + _tag)).stack;
}

// Make sure CONST is defined so other scripts can add their constants to it.
var CONST = {};

// Add some global constants:
CONST.NO_VALUE = NaN;

// Format specifiers:
var FORMAT = {
    NONE: 0,
    _360: 1,
    _180: 2,
    DMS: 3,
    HMS: 4,
    CLK_HMS: 5
};

// Builder for AtmosphericLayerData struct:
function buildAtmosphericLayerData(_startHeight, _endHeight, _startPressure, _endPressure, _stdTemperature, _lapseRate) {
    var layer = {
        StartHeight: _startHeight,
        EndHeight: _endHeight,
        StartPressure: _startPressure,
        EndPressure: _endPressure,
        StdTemperature: _stdTemperature,
        LapseRate: _lapseRate
    };
    return layer;
}

// Make a convenient function for inheritance:
// (Adding on to base classes is no-no, but this simplifies things a lot)
Function.prototype.inheritsFrom = function (_parentClass) {
    this.prototype = new _parentClass;
    this.prototype.constructor = this;
    this.prototype.parent = _parentClass.prototype;
    return this;
}

// Pointer class to fudge some of the C++ pointers:
function Pointer(reference) {
    this.ptr = reference;
}

var Calculator = {
    hasValue: function (_value) {
        // NaN does some weird things.
        // First check if CONST.NO_VALUE is NaN:
        if (isNaN(CONST.NO_VALUE)) {
            return !isNaN(_value);
        }
        else {
            return _value !== CONST.NO_VALUE;
        }
    },
    hasNoValue: function (_value) {
        if (isNaN(CONST.NO_VALUE)) {
            return isNaN(_value);
        }
        else {
            return _value === CONST.NO_VALUE;
        }
    }
};

function assertError(_message, _data) {
    var err = new Error("Assertion Failed:" + _message);
    console.log(err.stack);
    err.trace = err.stack;
    err.data = _data;
    throw err;
}

try {
    new CustomEvent("test");
}
catch (e) {
    (function () {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };

        CustomEvent.prototype = window.Event.prototype;

        window.CustomEvent = CustomEvent;
    })();
}
try {
    new Event("test");
}
catch (e) {
    (function () {
        function Event(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('Event');
            evt.initEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };

        Event.prototype = window.Event.prototype;

        window.Event = Event;
    })();
}
