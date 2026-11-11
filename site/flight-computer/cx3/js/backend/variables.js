/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Variable.
 * NOTE - preferredUnits_ is handled differently than in the C++ code.
 */

/**
 * A Variable has a name, an optional value, and a Dimension.
 * Changes to its value cause its dependents to be notified.
 * @ctor
 * Constructor
 * Constructor description.
 * @tparam String _name The display name of this Variable.
 * @tparam Dimension _kind The type of this Variable.
 * @tparam bool _acceptsInput Determines whether this Variable supports user input (default: false).
 * @tparam bool _isActive Determines whether this input is currently active (default: true).
 */
function Variable(_name, _kind, _acceptsInput, _isActive) {
    _acceptsInput = (typeof _acceptsInput !== "undefined") ? _acceptsInput : false;
    _isActive = (typeof _isActive !== "undefined") ? _isActive : true;

    Observable.call(this);

    this.name_ = _name;
    this.kind_ = _kind;
    this.myUnitIndex_ = 0;
    this.preferredUnits_ = new Pointer(this.kind_.defaultUnit());
    this.value_ = CONST.NO_VALUE;
    this.lastValue_ = CONST.NO_VALUE;
    this.hasValue_ = false;
    this.computed_ = false;
    this.copied_ = false;
    this.active_ = _isActive;
    this.useDefaultUnit_ = false;
    this.acceptsInput_ = _acceptsInput;
    this.locked_ = false;
    this.unitLocked_ = false;
}

// Variable is a subclass of Observable:
Variable.inheritsFrom(Observable);


// toString override added to prototype of Foo class
// Variable.prototype.toString = function()
// {
//     return "Variable(" + 
//       "name=" + this.name() + ", " +
//       "value=" + this.value() + ", " +
//       ")";
// }



// Basic accessors:
Variable.prototype.name = function () {
    return this.name_;
}

Variable.prototype.kind = function () {
    return this.kind_;
}

Variable.prototype.value = function () {
    return this.value_;
}

Variable.prototype.lastValue = function () {
    return this.lastValue_;
}

Variable.prototype.isComputed = function () {
    return this.computed_;
}

Variable.prototype.isCopied = function () {
    return this.copied_;
}

Variable.prototype.setCopied = function (_copied) {
    this.copied_ = _copied;
}

Variable.prototype.isReadOnly = function () {
    return this.acceptsInput_;
}

Variable.prototype.setReadOnly = function (_is_readonly) {
    this.acceptsInput_ = _is_readonly;
}

Variable.prototype.isActive = function () {
    return this.active_;
}

Variable.prototype.isLocked = function () {
    return this.locked_;
}

Variable.prototype.isUnitLocked = function () {
    return this.unitLocked_;
}

Variable.prototype.setLock = function (_lock) {
    this.locked_ = _lock;
}

Variable.prototype.setUnitLock = function (_lock) {
    this.unitLocked_ = _lock;
}

Variable.prototype.getUseDefaultUnit = function () {
    return this.useDefaultUnit_;
}

Variable.prototype.setUseDefaultUnit = function (_useDefault) {
    this.useDefaultUnit_ = _useDefault;
}

Variable.prototype.myPreferredUnit = function () {
    return this.preferredUnits_.ptr;
}

Variable.prototype.units = function () {
    return this.kind().units();
}

/**
 * Returns the name of the base units
 * @treturn String The name of the base units.
 */
Variable.prototype.baseUnitName = function () {
    return this.kind().baseUnitName();
}

/**
 * Gets the default Unit.
 * @treturn Unit The default Unit.
 */
Variable.prototype.defaultUnit = function () {
    if (arguments.length > 0) {
        assertError("Wrong number of arguments passed. Try Variable.prototype.setDefaultUnit", arguments);
    }
    return this.kind().defaultUnit();
}

/**
 * Sets the active flag (Used by trip planner)
 * @tparam bool _isActive Whether the Variable is active or not.
 */
Variable.prototype.setActive = function (_isActive) {
    if (this.active_ != _isActive) {
        this.active_ = _isActive;
        this.changed();
    }
}

/**
 * Sets the preferred unit.
 * @tparam Unit _pref Pointer? to the preferred unit.
 */
Variable.prototype.setPreferredUnit = function (_pref) {
    if (!(_pref instanceof Pointer)) {
        throw stackTrace("Not valid pointer");
    }
    // TODO: verify that this is the correct functionality.
    if ((this.preferredUnits_ != _pref) || (this.useDefaultUnit_ && this.defaultUnit() != _pref.ptr)) {
        this.preferredUnits_ = _pref;
        if (this.useDefaultUnit_) {
            this.kind().setDefaultUnit(_pref.ptr);
        }

        this.changed();
    }
}

/**
 * Gets the preferred Unit's index in the Dimension.
 * @treturn int The index of the preferred Unit in this Variable's Dimension.
 */
Variable.prototype.getUnitIndex = function () {
    return this.kind().getUnitIndex(this.preferredUnits_.ptr);
}

/**
 * Gets the format of this Variable's preferred Unit.
 * @treturn FORMAT Enum specifying how this variable will be displayed.
 */
Variable.prototype.specialFormat = function () {
    return this.myPreferredUnit().specialFormat();
}

/**
 * Check my default unit and indicate if changed (by another variable
 * with the same defined unit).
 */
Variable.prototype.checkDefaultUnit = function () {
    if (this.useDefaultUnit_ && this.preferredUnits_.ptr != this.kind().defaultUnit()) {
        this.preferredUnits_.ptr = this.kind().defaultUnit();
        this.unitLocked_ = true;
        this.changed();
        this.unitLocked_ = false;
    }
}

/**
 * Change default unit.
 * @treturn bool Returns true if changed.
 */
Variable.prototype.rotatePreferredUnit = function () {
    if (this.kind().nUnits() > 1) {
        this.preferredUnits_.ptr = this.kind().rotateUnit(this.preferredUnits_.ptr);
        // Set the new preferred units before calling chagned():
        if (this.useDefaultUnit_) {
            this.kind().setDefaultUnit(this.preferredUnits_.ptr);
        }
        // Lock the unit to prevent cascading unit chages:
        this.unitLocked_ = true;
        this.changed();
        this.unitLocked_ = false;

        return true;
    }
    else {
        return false;
    }
}

/**
 * Sets my default unit.
 * @tparam Unit _newDefault The new default Unit.
 */
Variable.prototype.setDefaultUnit = function (_newDefault) {
    // Make a change if the current units are different than the new units:
    if (this.useDefaultUnit_ && this.defaultUnit() != _newDefault) {
        if (this.kind().setDefaultUnit(_newDefault)) {
            this.changed();
        }
        else {
            assertError("Unit " + _newDefault.name() + " not in Dimension " + this.kind().name());
        }
    }
}

/**
 * Gets a string representation of the properly formatted value.
 * @treturn String The value, properly formatted.
 */
Variable.prototype.formatValue = function () {
    if (this.hasValue()) {
        return this.myPreferredUnit().formatValue(this.value());
    }
    else {
        return "";
    }
}

/**
 * Gets a string representation of the properly formatted last value.
 * @treturn String The last value, properly formatted.
 */
Variable.prototype.formatLastValue = function () {
    if (this.hasLastValue()) {
        return this.myPreferredUnit().formatValue(this.lastValue());
    }
    else {
        return "";
    }
}

/**
 * Gets a string representation of the properly formatted value with unit name.
 * @treturn String The value, properly formatted with the unit name.
 */
Variable.prototype.formatValueWithUnitName = function () {
    if (this.hasValue()) {
        return this.myPreferredUnit().formatValueWithUnitName(this.value());
    }
    else {
        return "";
    }
}

/**
 * Gets this value in the default units.
 * @treturn double The value converted to the default units.
 */
Variable.prototype.valueInDefaultUnits = function () {
    return this.kind_.defaultUnit().convert(this.value_);
}

/**
 * Gets this value in the preferred units.
 * @treturn double The value converted to the preferred units.
 */
Variable.prototype.valueInPreferredUnits = function () {
    return this.myPreferredUnit().convert(this.value_);
}

/**
 * Checks if this Variable has a valid value.
 * @treturn bool Returns true if this variable has a value and it is good.
 */
Variable.prototype.hasValue = function () {
    return this.hasValue_ && Calculator.hasValue(this.value_);
}

/**
 * Checks if this Variable does no have a valid value.
 * @treturn bool Returns true if this variable does not have a value or it is not good.
 */
Variable.prototype.hasNoValue = function () {
    return (!this.hasValue_) || Calculator.hasNoValue(this.value_);
}

/**
 * Checks if this Variable has a valid last value.
 * @treturn bool Returns true if this variable has a last value and it is good.
 */
Variable.prototype.hasLastValue = function () {
    return Calculator.hasValue(this.lastValue_);
}


/**
 * Sets the Variable's value.  This version allows the caller to set a flag
 * indicating that the value was obtained during a calculation (rather than
 * user input).  This eases the UI's job of determining the varialbe's
 * status when going to display it.
 * @tparam double _v The value to set.
 * @tparam bool _calculated True if this was a calculated value.
 */
Variable.prototype.setValue = function (_v, _calculated) {
    _calculated = (typeof _calculated !== "undefined") ? _calculated : false;

    // Only allow the value to change if we're unlocked:
    if (this.locked_) {
        return;
    }

    var oldHasValue = this.hasValue_;
    var oldValue = this.value_;
    this.value_ = _v;
    this.computed_ = _calculated;
    this.copied_ = false;
    this.hasValue_ = Calculator.hasValue(_v);
    if (this.hasValue_ || oldHasValue) {
        this.lastValue_ = oldValue;
        this.changed();
    }
}

/**
 * Converts and sets the value
 * @tparam double _v The value to convert.
 * @tparam bool _calculated True if this was a calculated value.
 */
Variable.prototype.convertValue = function (_v, _calculated) {
    _calculated = (typeof _calculated !== "undefined") ? _calculated : false;

    if (this.locked_) {
        return;
    }

    var converted = this.myPreferredUnit().convertToDefault(_v);
    this.setValue(converted, _calculated);
}

// set my value from a value_t
// Note that setting value is done in base dimension units!!!  TODO: should 
// this change to expect default units and convert approprately?
Variable.prototype.copyFromValue = function (v) {
    // only allow the value to change if we're unlocked.
    if (this.locked_)
        return;

    var oldHasValue = this.hasValue_;
    var oldValue = this.value_;
    this.value_ = v;
    this.computed_ = false;
    this.hasValue_ = Calculator.hasValue(v);
  if (this.hasValue_ || oldHasValue)
  {
        this.last_value_ = oldValue;
        this.changed();
    }
}

// set my value from another Variable
// TODO reject incompatible dimensions?
// do we need to prevent this if we're locked?
Variable.prototype.copyFromVariable = function (v) {
    var oldHasValue = this.hasValue_;
    this.value_ = v.value();
    this.hasValue_ = v.hasValue();
    this.computed_ = v.isComputed();
    this.accepts_input_ = v.isReadOnly();
    this.last_value_ = CONST.NO_VALUE;
  if (this.hasValue_ || oldHasValue)
  {
        this.changed();
    }
}

/**
 * Set the Variable's value from a string representation.
 * @tparam String _str The string to parse.
 * @treturn bool Returns true if sucessful.
 */
Variable.prototype.setValueFromString = function (_str) {
    if (this.locked_) {
        return false;
    }

    var specFormat = this.myPreferredUnit().specialFormat();

    // Check for HMS or DMS input:
    if (specFormat >= FORMAT.DMS) {
        var tmp = calculateValueFromHmsString(_str);
    }
    else {
        var tmp = parseFloat(_str);
    }

    // Check for format input limits
    if (specFormat != FORMAT.NONE) {
        // angles (except DMS)
        if (specFormat < FORMAT.DMS) {
            // limit 0 to 360 degrees
            tmp = tmp % 360.0;
            if (tmp < 0) {
                tmp = tmp + 360;
            }

            // or +/- 180 degrees 
            if (specFormat == FORMAT._180) {
                if (tmp > 180) {
                    tmp -= 360;
                }
            }
        }
        // DMS angles 
        else if (specFormat == FORMAT.DMS) {
            // limit 0 to 360 degrees
            tmp = tmp % CONST.MAX_DMS_ANGLE;
            if (tmp < 0) {
                tmp = tmp + CONST.MAX_DMS_ANGLE;
            }
        }
        // duration in HMS 
        else if (specFormat == FORMAT.HMS) {
            if (tmp > CONST.MAX_HMS_HOURS) {
                tmp = CONST.MAX_HMS_HOURS;
            }
            //TODO: allow only positive durations? 
            else if (tmp < (-CONST.MAX_HMS_HOURS)) {
                tmp = -CONST.MAX_HMS_HOURS;
            }
        }
        // 24 hour clock
        else if (specFormat == FORMAT.CLK_HMS) {
            tmp = tmp % CONST.MAX_24HR_TIME;
            if (tmp < 0) {
                tmp = tmp + CONST.MAX_24HR_TIME;
            }
        }
    }
    // since the user entered this value, prevent the equations from
    // changing it.  Note that this will cause some problems that still need
    // to be worked out...
    this.setValue(this.myPreferredUnit().convertToDefault(tmp));
    return true;
}

/**
 * Change the variable back to having no value.
 */
Variable.prototype.clearValue = function () {
    var oldHasValue = this.hasValue_;
    var oldValue = this.value_;
    this.value_ = CONST.NO_VALUE;
    this.hasValue_ = false;
    this.computed_ = false;
    this.copied_ = false;
    this.locked_ = false;

    if (this.hasValue_ || oldHasValue) {
        this.lastValue_ = oldValue;
        this.changed();
    }
}
