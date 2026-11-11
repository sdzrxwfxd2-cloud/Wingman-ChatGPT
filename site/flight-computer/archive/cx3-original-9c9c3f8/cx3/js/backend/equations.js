/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Equation.
 */

/**
 * Description of class.
 * This class inherits from Observable and Observer.  Observer is an abstract class, so it is not explicitly inherited.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam Variable _output The variable holding the result of this Equation.
 * @tparam Variables inputsVariableLenght This is a variable argument length function. This is to signify the inputs.
 */
function Equation(_output, inputsVariableLength) {
    Observable.call(this);

    this.output_ = _output;
    this.calculationError_ = false;
    this.activeScreen_ = false;          // equation is currently displyed/active (check for def/similar unit changes)
    //this.preferredUnits_ = null; // specific to this equation's output variable
    this.preferredUnits_ = new Pointer(null); // specific to this equation's output variable

    this.inputs_ = [];
    // Copy all arguments after _output as inputs:
    for (var i = 1; i < arguments.length; i++) {
        if (arguments[i] !== undefined && arguments[i] !== null) { // Have to make this check for inheritance to work
            arguments[i].addDependent(this);
            this.inputs_.push(arguments[i]);
        }
    }

    this.canComputeNow_ = this.canCompute();
}

// Equation is a subclass of Observable:
Equation.inheritsFrom(Observable);

/**
 * Can compute if all inputs have values.
 * @treturn bool Returns true if all inputs have values.
 */
Equation.prototype.canCompute = function () {
    for (var i in this.inputs_) {
        if (!this.inputs_[i].hasValue()) {
            return false;
        }
    }
    return true;
}

/**
 * Returns one of the Variable inputs.
 * @tparam int _index The input Variable to get.
 * @treturn Variable The input Variable at the index.
 */
Equation.prototype.getInput = function (_index) {
    if (_index < this.inputs_.length) {
        return this.inputs_[_index];
    }
    return null;
}

/**
 * This function is the responsibility of the subclass.
 * @treturn double The result of the equation.
 */
Equation.prototype.compute = function () {
    // Abstract function - should never be called.
    assertError("Abstract Function Called.");
}

/**
 * Gets the number of inputs.
 * @treturn int The number of input Variables.
 */
Equation.prototype.nInputs = function () {
    return this.inputs_.length;
}

/**
 * Gets the output Variable.
 * @treturn Variable The output Variable.
 */
Equation.prototype.getOutput = function () {
    return this.output_;
}

/**
 * Gets the error state of this equation.
 * @treturn bool Whether this equation has a calculation error or not.
 */
Equation.prototype.getErrorState = function () {
    return this.calculationError_;
}

/**
 * Gets the active state.
 * @treturn bool The active state.
 */
Equation.prototype.getActiveState = function () {
    return this.activeScreen_;
}

/**
 * Sets the active state.
 * @tparam bool _active.
 */
Equation.prototype.setActiveState = function (_active) {
    this.activeScreen_ = _active;
}

/**
 * Set the equation's output variable to use desired units
 */
Equation.prototype.setPreferredUnits = function () { }

/**
 * Check the equations' output variable for change in similar unit
 * (e.g. fuel rate from LPH to GPH -> fuel vol from liters to gallons
 */
Equation.prototype.checkPreferredUnits = function () { }

/**
 * Set the new preferred unit for this equation.
 * @tparam Unit _newUnit.
 */
Equation.prototype.setNewPreferredUnits = function (_newUnit) {
    this.preferredUnits_.ptr = _newUnit;
}

/**
 * Shorthand functions for the inputs' value.
 * I don't know why these start at index 1, but I'm
 * keeping them in there for compatibility reasons.
 * @treturn double This input Variable's value.
 */
Equation.prototype.input1 = function () {
    return this.inputs_[0].value();
}
Equation.prototype.input2 = function () {
    return this.inputs_[1].value();
}
Equation.prototype.input3 = function () {
    return this.inputs_[2].value();
}
Equation.prototype.input4 = function () {
    return this.inputs_[3].value();
}

/**
 * Default: set output from inputs if we can.
 * Called when input values change.
 * @tparam Observable _noName description.
 * @tparam int _nUpdates (default: 0).
 */
Equation.prototype.update = function (_noName, _nUpdates) {
    // Unit change:
    // only check for global or by equation screen unit change if this is the active equation screen
    // skip if changing units individually
    if ((this.activeScreen_ == true) && (UnitChange.defaultUnit() != change_individual)) {
        //always check to see if input with same defined unit changed default unit
        if (this.output_.getUseDefaultUnit() == true) {
            this.output_.checkDefaultUnit();

            // make sure our preferred unit matches
            if (this.preferredUnits_.ptr != this.output_.defaultUnit()) {
                this.preferredUnits_.ptr = this.output_.defaultUnit();
            }
        }

        // only check change in similar unit if not locked
        if (this.output_.isUnitLocked() == false) {
            //check to see if imput with similar unit has changed default unit
            this.checkPreferredUnits();

            // clear unit change lock after checking default/preffered
            // NOTE: set lock in above routines if changed to prevent cascading changes
            this.output_.setUnitLock(false);
        }
    }
    // clear the error state since one of our input variables has changed.
    this.calculationError_ = false;

    var couldCompute = this.canComputeNow_;
    this.canComputeNow_ = this.canCompute();
    if (this.canComputeNow_) {
        var oldValue = this.output_.value();
        var newValue = this.compute();
        // Set calculation error if very large value (e.g. divide by zero)
        if ((newValue > CONST.ERROR_VALUE) || (newValue < -CONST.ERROR_VALUE)) {
            this.calculationError_ = true;
        }

        //TODO: handle calculation error more gracefully - clear if has old value?
        if (!this.calculationError_) {
            // if the output has a value, we need to see if it has changed.
            if (this.output_.hasValue()) {
                // skip if output is locked (new value will not be saved)
                if (this.output_.isLocked()) {
                    return;
                }
                // skip if both old and new values greater than max value
                if ((oldValue > CONST.MAX_VALUE) && (newValue > CONST.MAX_VALUE)) {
                    return;
                }

                // A change is only propagated if the value is different by an amount
                // greater than the specified precision.
                // TODO: do we need to save the new computed value even though we are not
                // notifying the user?
                var delta = Math.abs(oldValue - newValue);
                var maxDiff = Math.pow(10, (0 - this.output_.kind().defaultPrecision()));
                if (delta < maxDiff) {
                    return;
                }
            }
            else {
                // lock the inputs to prevent cascading calculations.
                if (!this.output_.isReadOnly()) {
                    for (var i in this.inputs_) {
                        this.inputs_[i].setLock(true);
                    }
                }
            }
            // using this method to set the value allows the computed_ flag to be set, which
            // is very helpful to the UI when displaying status.
            this.output_.setValue(newValue, true);
            this.changed(_nUpdates);  // notify our observers if any
        }


    }
    else {    // can't compute.
        // if we could compute previously, but now can't, clear the output variable.
        if (couldCompute) {
            this.output_.clearValue();
            //holding pattern entry type: set unit back to no text
            // TODO: move this routine to the entry type equation?
            if (this.output_.kind() == entry) {
                this.preferredUnits_.ptr = entry_noText;
                this.output_.setPreferedUnit(this.preferredUnits_);
                this.output_.changed();
            }
            this.changed(_nUpdates);  // notify our observers if any on state change
        }
    }
}

