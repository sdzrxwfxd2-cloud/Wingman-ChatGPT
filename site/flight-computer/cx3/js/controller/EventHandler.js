/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for EventHandler.
 */

/**
 * Description of class.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam type name description.
 */
function EventHandler() {
    this.events_ = {};
    this.owner = undefined;
}

/**
 * Adds an event to handle.
 * @tparam String _eventName The name of the event to target.
 * @tparam Funciton _func The handler to add.
 * @tparam bool _head (optional) If true, add this handler to the front of the list.
 */
EventHandler.prototype.addEvent = function (_eventName, _func, _head) {
    _head = (typeof _head !== "undefined") ? _head : false;

    // Create the list for this event if it does not exist:
    if (this.events_[_eventName] === undefined) {
        this.events_[_eventName] = [];
    }

    // Add this event handler to the front or back of the queue:
    if (_head) {
        this.events_[_eventName].unshift(_func);
    }
    else {
        this.events_[_eventName].push(_func);
    }
}

/**
 * Returns true if a specific handler exists.
 * @tparam String _eventName The name of the event to target.
 * @tparam Funciton _func The handler to check.
 * @treturn bool True if the handler exists.
 */
EventHandler.prototype.hasEvent = function (_eventName, _func) {
    return this.events_[_eventName].indexOf(_func) != -1;
}

/**
 * Removes a specific event.
 * @tparam String _eventName The name of the event to target.
 * @tparam Funciton _func The handler to remove.
 */
EventHandler.prototype.removeEvent = function (_eventName, _func) {
    if (this.events_[_eventName] !== undefined) {
        var evt = this.events_[_eventName];
        while (-1 != (i = evt.indexOf(_func))) {
            evt.splice(i, 1);
        }
    }
}

/**
 * Removes all handlers for a specific event name.
 * @tparam String _eventName The name of the event to remove.
 */
EventHandler.prototype.removeAllEventsNamed = function (_eventName) {
    delete this.events_[_eventName];
}

/**
 * Removes all event handlers from this object.
 */
EventHandler.prototype.removeAllEvents = function () {
    this.events_ = {};
}

/**
 * Fires an event.
 * @tparam String _eventName The event to fire.
 * @tparam Object _details The details of this event.
 */
EventHandler.prototype.fire = function (_eventName, _details) {
    // Set the target if it is not set:
    if (typeof _details["target"] == "undefined") {
        _details["target"] = this;
    }
    // Send log:
    if (DEBUG_EVENTS) {
        console.log("Event: " + _eventName);
        console.log(_details);
        console.log(this);
    }
    // Run all event handlers for this event:
    for (var i in this.events_[_eventName]) {
        if (typeof this.events_[_eventName][i] == "function") {
            this.events_[_eventName][i].call(this, _details);
        }
        if (_details["handled"] === true) {
            break;
        }
    }

    // Pass this event up if it was not handled:
    if (_details["handled"] !== true && this.owner !== undefined) {
        this.owner.fire(_eventName, _details);
    }
}


/**
 * Fires an event when execution time is available.
 * @tparam String _eventName The event to fire.
 * @tparam Object _details The details of this event.
 */
EventHandler.prototype.post = function (_eventName, _details) {
    // Don't worry about bindings, just use a closure:
    var temp = this;
    window.setTimeout(function () { temp.fire(_eventName, _details); }, 0);
}
