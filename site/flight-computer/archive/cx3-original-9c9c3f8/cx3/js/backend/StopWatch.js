/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for StopWatch.
 */

/**
 * Maintains a precise counter that can be stopped and started.
 * This stop watch also trigger periodic events for each second elapsed.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam type name description.
 */
function StopWatch() {
    // Bind the timeout and interval function to this object:
    this.tick = StopWatch.TICK.bind(this);

    this.elapsedTime_ = 0;
    this.timeoutVar_ = undefined;
    this.callback_ = undefined;
}

/**
 * Description of function.
 * @tparam type name description.
 * @treturn type description.
 */
StopWatch.prototype.setTickCallback = function (func) {
    this.callback_ = func;
}

/**
 * Starts/Continues the stop watch.
 */
StopWatch.prototype.start = function () {
    // Is this stop watch already running?
    if (this.running_) {
        return;
    }

    // Set the start time:
    var temp = new Date();
    this.startTime_ = temp.getTime() + (temp.getTimezoneOffset() * 60000);

    // Calculate how many milliseconds to the next seconds mark:
    var remainingTime = 1000 - (this.getElapsedTime() % 1000);

    // Mark this stop watch as running:
    this.running_ = true;

    // Start the first tick:
    this.timeoutVar_ = window.setTimeout(this.tick, remainingTime);
}

/**
 * Stops the stop watch and calculates the elapsed time.
 */
StopWatch.prototype.stop = function () {
    // Nothing to do if this is already stopped.
    if (!this.running_) {
        return;
    }

    // kill off the timeout/interval if they exist:
    window.clearTimeout(this.timeoutVar_);
    window.clearInterval(this.intervalVar_);

    // Get the current time:
    var temp = new Date();
    // Convert this date to UTC time:
    var stopTime = temp.getTime() + (temp.getTimezoneOffset() * 60000);

    // Mark the time travelled:
    this.elapsedTime_ += stopTime - this.startTime_;

    // Make this as stopped:
    this.running_ = false;
}

/**
 * Resets the stopwatch and starts it again.
 */
StopWatch.prototype.restart = function () {
    this.reset();
    this.start();
}

/**
 * Stops the stop watch and clears the elapsed time.
 */
StopWatch.prototype.reset = function () {
    this.stop();
    this.elapsedTime_ = 0;
}

/**
 * Description of function.
 * @tparam type name description.
 * @treturn type description.
 */
StopWatch.prototype.getElapsedTime = function () {
    // Is the stop watch running?
    if (this.running_) {
        // Recalculate elapsed time:
        var temp = new Date();
        var currentTime = temp.getTime() + (temp.getTimezoneOffset() * 60000);
        return this.elapsedTime_ + (currentTime - this.startTime_);
    }
    else {
        // If it is stopped, then elapsed time is up to date:
        return this.elapsedTime_;
    }
}

/**
 * This is the stopwatch tick, which will adjust for any remaining milliseconds
 * in the second. (setInterval will drift, so setTimeout is used to adjust for processing time.)
 * This is not part of the prototype.  This function will be bound to the object at
 * construction to ensure "this" references the object and not the window.
 */
StopWatch.TICK = function () {
    // Make sure this stopwatch is still active.
    if (this.running_) {

        // Do the callback:
        if (typeof this.callback_ == "function") {
            this.callback_(this.getElapsedTime());
        }
        // Calculate how many milliseconds to the next seconds mark:
        var remainingTime = 1000 - (this.getElapsedTime() % 1000);

        // Schedule the next tick:
        this.timeoutVar_ = window.setTimeout(this.tick, remainingTime);
    }
}
