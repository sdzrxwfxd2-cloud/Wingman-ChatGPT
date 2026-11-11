/*
CX-3 - Flight Calculator
Copyright (c) 2026 Go Around, South Africa. All rights reserved.
*/

/**
 * @file
 * Functions for reading and formating Hms and Dms values.
 */

/**
 * Description of function.
 * @tparam String _str The string to parse.
 * @treturn double the value of the parsed string.
 */
function calculateValueFromHmsString(_str) {
    var parts = _str.split(':');
    var hours = parseFloat(parts[0]);
    var minutes = parseFloat(parts[1]);
    var seconds = parseFloat(parts[2]);
    var negative = (hours < 0);

    if (DEBUG) {
        console.log(arguments.callee.name);
        console.log(parts);
    }
    if (isNaN(hours)) {
        return 0;
    }
    if (negative) {
        // normalize the number so the conversion can work.
        hours = -hours;
    }

    var total = hours * 3600;
    if (!isNaN(minutes)) {
        total = total + (minutes * 60);
    }
    if (!isNaN(seconds)) {
        total = total + seconds;
    }

    if (negative) {
        total = -total;
    }
    return total;
}

/**
 * Description of function.
 * @tparam double _val The value to format.
 * @tparam bool _clock TODO.
 * @treturn String The value formatted as Hms.
 */
function formatHmsValue(_val, _clock) {
    var negative = (_val < 0);
    var sign = "";

    if (negative) {
        sign = "-";
        _val = -_val;
    }

    var hours = Math.floor(_val / 3600);
    _val = _val - (hours * 3600);
    var minutes = Math.floor(_val / 60);
    var seconds = _val - (minutes * 60);

    // If clock format, hours are 2 digits:
    hours = hours.toFixed(0);
    if (_clock && hours.length < 2) {
        hours = "0" + hours;
    }
    minutes = minutes.toFixed(0);
    if (minutes.length < 2) {
        minutes = "0" + minutes;
    }
    seconds = seconds.toFixed(0);
    if (seconds.length < 2) {
        seconds = "0" + seconds;
    }

    return sign + hours + ":" + minutes + ":" + seconds;
}
