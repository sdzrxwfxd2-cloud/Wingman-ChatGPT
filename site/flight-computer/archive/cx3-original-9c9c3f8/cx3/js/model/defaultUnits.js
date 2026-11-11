/*
   CX-3 - Flight Calculator
   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
 */

/**
 * @file
 * Arrays holding default US and metric units.
 */

//NOTE: the order of units must match the order in setDefaultUnitScreens[]
var us_default_units = [
    knots_gs,
    knots_as,
    nm,
    altitude_feet,
    length_inches,
    hours,
    temperature_fahrenheit,
    inHg,
    us_gph,
    us_gallons,
    ft_per_min_cr,
    feet_per_nm,
    us_pounds,
    pound_inch,
    dms_dms,
    us_pounds_hr
];

var metric_default_units = [
    knots_gs,
    knots_as,
    nm,
    altitude_meters,
    length_meters,
    hours,
    temperature_celsius,
    millibar,
    lph,
    liters,
    meter_per_sec_cr,
    meter_per_nm,
    kilograms,
    newton_meter,
    dms_dms,
    kilograms_hr
];
