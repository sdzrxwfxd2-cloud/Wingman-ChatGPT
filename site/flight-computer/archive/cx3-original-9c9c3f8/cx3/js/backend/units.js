/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Class for Dimension and Unit
 */

// TODO: move this to a global file.
CONST.MAX_VALUE = 1e20,
    CONST.ERROR_VALUE = 1e25,
    CONST.MAX_HMS_HOURS = (100000 * 60 * 60 - 1),
    CONST.MAX_TIMER_VALUE = (100 * 60 * 60 - 1),
    CONST.MAX_24HR_TIME = (24 * 60 * 60),
    CONST.MAX_DMS_ANGLE = (360 * 60 * 60),
    CONST.MAX_CHARACTERS = 9

/**
 * Contains all units for a certain dimesion.
 * @ctor
 * Constructor
 * Creates a new Dimension.
 * @tparam String _name The display name of this dimension.
 * @tparam Int _defaultPrecision The default number of digits to display (default: 2).
 * @tparam String _baseUnitName The display name of the base unit (default: "").
 */
function Dimension(_name, _defaultPrecision, _baseUnitName) {
    _defaultPrecision = (typeof _defaultPrecision !== "undefined") ? _defaultPrecision : 2;
    _baseUnitName = (typeof _baseUnitName !== "undefined") ? _baseUnitName : "";

    this.name_ = _name;
    this.units_ = new Array();
    this.defaultUnitIndex_ = 0;
    this.defaultPrecision_ = _defaultPrecision;
    this.baseUnitName_ = _baseUnitName;
}

Dimension.prototype.name = function () {
    return this.name_;
}

Dimension.prototype.units = function () {
    return this.units_;
}

Dimension.prototype.baseUnitName = function () {
    return this.baseUnitName_;
}

Dimension.prototype.defaultPrecision = function () {
    return this.defaultPrecision_;
}

/**
 * Adds a Unit to this Dimension type.
 * @tparam Unit _unit The Unit to add.
 */
Dimension.prototype.addUnit = function (_unit) {
    if (_unit.kind() !== this) {
        console.log("wrong dimension for unit:" + _unit.name());
    }
    this.units().push(_unit);
}

/**
 * Gets the number of Units in this Dimension.
 * @treturn int The number of Units in this Dimension..
 */
Dimension.prototype.nUnits = function () {
    return this.units().length;
}


/**
 * Rotates to the next Unit as the default.
 * @treturn bool Returns true if the default Unit has changed.
 */
Dimension.prototype.rotateDefaultUnit = function () {
    var temp = this.defaultUnitIndex_ + 1;
    if (temp >= this.nUnits()) {
        temp = 0;
    }
    this.defaultUnitIndex_ = temp;
    return this.nUnits() > 1;
}

/**
 * Gets this Dimension's default Unit.
 * @treturn Unit Returns the default Unit.
 */
Dimension.prototype.defaultUnit = function () {
    // Check the number of arguments since there was another function .defaultUnit(_newDefault)
    // that could be created due to javascript.  It was moved to setDefaultUnit(_newDefault).
    // Throw an error if there are too many arguments.
    if (arguments.length > 0) {
        assertError("Wrong number of arguments passed. Try Dimension.prototype.setDefaultUnit", arguments);
    }
    return this.units_[this.defaultUnitIndex_];
}

/**
 * Sets the new default unit.
 * @tparam Unit _newDefault The Unit that should be the default. Leave the argument blank to reset the default unit.
 * @treturn bool returns true if the default unit gets set.
 */
Dimension.prototype.setDefaultUnit = function (_newDefault) {
    // Check if the argument exists:
    if (_newDefault === 0) {
        this.defaultUnitIndex_ = 0;
        return true;
    }
    else {
        var temp = this.getUnitIndex(_newDefault);
        if (temp != -1) {
            this.defaultUnitIndex_ = temp;
            return true;
        }
    }
    return false;
}

/**
 * Finds the index of a particular unit.
 * @tparam Unit _unit the Unit to find.
 * @treturn int Returns the index of this Unit.
 */
Dimension.prototype.getUnitIndex = function (_unit) {
    // DIFF: This has a discrepancy from the original code.
    // The original code would return 0 if the unit could
    // not be found.  This will return -1.
    return this.units_.indexOf(_unit);
}

/**
 * Gets the Unit after _currentUnit
 * @tparam Unit _currentUnit The current Unit to rotate from.
 * @treturn Unit Returns the Unit that was rotated to.
 */
Dimension.prototype.rotateUnit = function (_currentUnit) {
    var index = this.getUnitIndex(_currentUnit) + 1;
    if (index >= this.nUnits()) {
        index = 0;
    }
    return this.units_[index];
}

Dimension.prototype.getDefaultUnit = function () {
    return this.defaultUnitIndex_;
}

Dimension.prototype.getUnit = function (_index) {
    return this.units_[_index];
}
// ======== //

/**
 * Represents a single unit for a Dimension.
 * It has a multiplicative factor that relates to its Dimension's basic unit.
 * It also has an offset to handle cases like degrees F to degrees C.
 * @ctor
 * Constructor
 * Creates a new Unit.
 * @tparam String _name The display name of this Unit.
 * @tparam Dimension _kind A reference to what kind of Unit it is.
 * @tparam double _factor A multiplicative factor from the Dimension's base unit (default: 1.0).
 * @tparam double _offset An offset from the Dimension's base unit (default: 0.0).
 * @tparam FORMAT _specialFormat How the Unit is formatted (default: FORMAT.NONE).
 */
function Unit(_name, _kind, _factor, _offset, _specialFormat) {
    _factor = (typeof _factor !== "undefined") ? _factor : 1.0;
    _offset = (typeof _offset !== "undefined") ? _offset : 0.0;
    _specialFormat = (typeof _specialFormat !== "undefined") ? _specialFormat : FORMAT.NONE;

    this.name_ = _name;
    this.kind_ = _kind;
    this.factor_ = _factor;
    this.offset_ = _offset;
    this.specialFormat_ = _specialFormat;

    this.kind_.addUnit(this);
}

Unit.prototype.name = function () {
    return this.name_;
}

Unit.prototype.setName = function (_name) {
    this.name_ = _name;
}

Unit.prototype.kind = function () {
    return this.kind_;
}

Unit.prototype.factor = function () {
    return this.factor_;
}

Unit.prototype.offset = function () {
    return this.offset_;
}

Unit.prototype.setOffset = function (_offset) {
    this.offset_ = _offset;
}

Unit.prototype.specialFormat = function () {
    return this.specialFormat_;
}

/**
 * Given a value in my Dimension's base units, return a value expressed in my units.
 * @tparam double _value A value represented in the Dimension's base units.
 * @treturn double Returns the value expressed in my units.
 */
Unit.prototype.convert = function (_value) {
    return (_value - this.offset_) / this.factor_;
}

/**
 * Given a value in my units, return a value expressed my Dimension's base units.
 * @tparam double _value A value represented my units.
 * @treturn double Returns the value expressed in the Dimension's base units.
 */
Unit.prototype.convertToDefault = function (_value) {
    return (_value * this.factor_) + this.offset_;
}

/**
 * Given a value in my Dimension's base units, return a properly formatted string for my units.
 * @tparam double _value A value represented my Dimension's base units.
 * @treturn String Returns a formatted sting in my units.
 */
Unit.prototype.formatValue = function (_value) {
    var converted = this.convert(_value);

    if (this.specialFormat_ >= FORMAT.DMS) {
        // Handle time formats:
        var negative = false;
        // Make sure the value is in bounds:
        switch (this.specialFormat_) {
            case FORMAT.DMS:
                if (converted < 0) {
                    converted += CONST.MAX_DMS_ANGLE;
                }
                break;
            case FORMAT.HMS:
                if (Math.abs(converted) > CONST.MAX_HMS_HOURS) {
                    return "E";
                }
                break;
            case FORMAT.CLK_HMS:
                converted = converted % CONST.MAX_24HR_TIME;
                if (converted < 0) {
                    converted += CONST.MAX_24HR_TIME;
                }
                break;
        }

        if (converted < 0) {
            negative = true;
            converted = -converted;
        }

        // Convert this value to hours/minutes/seconds:
        var temp = new Uint32Array(4);
        temp[0] = converted;
        temp[1] = temp[0] / 3600; // hours
        temp[0] %= 3600;
        temp[2] = temp[0] / 60; // minutes
        temp[3] = temp[0] % 60;

        var hour = temp[1].toString();
        var minute = temp[2].toString();
        var second = temp[3].toString();
        // If this is the clock format pad the hour out:
        if (this.specialFormat_ == FORMAT.CLK_HMS && hour.length < 2) {
            hour = "0" + hour;
        }
        if (minute.length < 2) {
            minute = "0" + minute;
        }
        if (second.length < 2) {
            second = "0" + second;
        }

        // Build the string:
        var toRet = (negative) ? "-" : "";
        toRet += hour + ":" + minute + ":" + second;
        return toRet;
    }
    else {
        // Handle normal numbers:

        // Normalize if it is an angle:
        if (this.specialFormat_ == FORMAT._360) {
            converted %= 360;
            if (converted < 0) {
                converted += 360;
            }
        }

        var prec = this.kind().defaultPrecision();
        var toRet = converted.toFixed(prec);

        // Is it too long?  Can we reduce the precision that is displayed?
        if (toRet.length > CONST.MAX_CHARACTERS && (prec > 0)) {
            toRet = converted.toFixed(0);
        }

        // Is it still too long? Fall back to scientific notation with one decimal digit:
        if (toRet.length > CONST.MAX_CHARACTERS) {
            toRet = converted.toExponential(1);
        }
        return toRet;
    }
}

/**
 * Given a value in my Dimension's base units, return a string for my units
 * that includes the name of my unit.
 * @tparam double _basicValue A value represented my Dimension's base units.
 * @treturn String Returns a sting in my units with unit name.
 */
Unit.prototype.formatValueWithUnitName = function (_basicValue) {
    var converted = this.convert(_basicValue);
    return converted.toFixed(this.kind().defaultPrecision()) + " " + this.name();
}
