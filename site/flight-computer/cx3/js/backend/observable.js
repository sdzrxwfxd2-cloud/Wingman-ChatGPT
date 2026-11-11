/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Observer.
 * Class for Observable.
 */

/**
 * This is an abstract class.  Javacript has no way of inforcing this, so
 * all this class has is function that will throw an error if they are ever
 * executed.  The errors can be prevented by overriding the function.
 * @ctor
 * Constructor
 * This construct really does nothing.
 */
function Observer() {
}

/**
 * Placeholder for the update function.
 * This is an abstract function. The default value for _nUpdate is just
 * for reference as javascript can't enforce this on it's subclasses.
 * @tparam Observable _from The Observable that is causing this update.
 * @tparam int _nUpdate Used to keep track of how far this update trickles down.
 */
Observer.prototype.update = function (_from, _nUpdates) {
    _nUpdates = (typeof _nUpdates !== "undefined") ? _nUpdates : 0;

    throw new Error("Observer.update not implemented in " + this.constructor.name);
}


// ======== //


/**
 * Holds a collection of Observers and notifies them of changes.
 * @ctor
 * Constructor
 * Constructor description.
 */
function Observable() {
    this.dependents = [];
}

/**
 * Finds the index of a dependent.
 * @tparam Observer _dep The Observer to look for.
 * @treturn int The index of this Observer or -1 if it is not found.
 */
Observable.prototype.findDependent = function (_dep) {
    return this.dependents.indexOf(_dep);
}

/**
 * Adds a dependent to the end of the list.
 * @tparam Observer _dep the Observer to add.
 */
Observable.prototype.addDependent = function (_dep) {
    // Make sure this dependent doesn't already exist:
    if (this.findDependent(_dep) == -1) {
        // Then add it:
        this.dependents.push(_dep);
    }
}

/**
 * Adds a dependent to the front of the list.
 * @tparam Observer _dep the Observer to add.
 */
Observable.prototype.addDependentAtHead = function (_dep) {
    // Make sure this dependent doesn't already exist:
    if (this.findDependent(_dep) == -1) {
        // Then add it:
        this.dependents.unshift(_dep);
    }
}

/**
 * Removes a dependent from the list.
 * @tparam Observer _dep The dependent to remove from the list.
 */
Observable.prototype.removeDependent = function (_dep) {
    var index = this.findDependent(_dep);

    if (index != -1) {
        this.dependents.splice(index, 1);
    }
}

/**
 * Notifies my dependents about a change in me.
 * @tparam int _nUpdates Possibly used to avoid cascading updates.
 */
Observable.prototype.changed = function (_nUpdates) {
    _nUpdates = (typeof _nUpdates !== "undefined") ? _nUpdates : 0;
    for (var x in this.dependents) {
        this.dependents[x].update(this, _nUpdates + 1);
    }
}
