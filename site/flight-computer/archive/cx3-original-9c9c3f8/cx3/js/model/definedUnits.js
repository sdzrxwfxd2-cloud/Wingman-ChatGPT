///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 921 $
// @date    $Date: 2013-06-28 14:10:19 -0700 (Fri, 28 Jun 2013) $
// @brief
//

// A note on the units:
// The base unit of Dimension objects is what is used in calcuations.  All the constants
// and equations depend on this base unit and any changes to it will likely cause
// some problems.  It is far from ideal to have such a tight coupling.  Further refactoring
// should fix this.

// NOTE: most unit dimensions have a default pointer below to initialize or globally set the unit
// for each dimension

// airSpeed
var air_speed = new Dimension('Air Speed', 2, 'M/S'); // base unit is meters/sec
var knots_as = new Unit('KTS', air_speed, 0.51444444);
var sm_per_hour_as = new Unit('MPH', air_speed, 0.44704);
var km_per_hour_as = new Unit('KPH', air_speed, 0.27777778);

// groundSpeed
var ground_speed = new Dimension('Ground Speed', 2, 'M/S'); // base unit is meters/sec
var knots_gs = new Unit('KTS', ground_speed, 0.51444444);
var km_per_hour_gs = new Unit('KPH', ground_speed, 0.27777778);
var sm_per_hour_gs = new Unit('MPH', ground_speed, 0.44704);

// climbRate
var climb_rate = new Dimension('Climb Rate', 2, 'M/S'); // base unit is meters/sec
var meter_per_sec_cr = new Unit('M/S', climb_rate);
var ft_per_min_cr = new Unit('FPM', climb_rate, 0.00508); //=.3048/60

// distance
var distance = new Dimension('Distance', 2, 'M'); // base unit is meters
var nm = new Unit('NM', distance, 1852.0);
var km = new Unit('KM', distance, 1000);
var sm = new Unit('SM', distance, 1609.344);
var meters = new Unit('M', distance);
var feet = new Unit('FT', distance, 0.3048);

// angle of climb
var climb_angle = new Dimension('Climb Angle', 2, 'M/M'); // base unit is meters/meter
var meter_per_nm = new Unit('M/NM', climb_angle, 1 / 1852.0);
var meter_per_km = new Unit('M/KM', climb_angle, 1 / 1000.0);
var feet_per_sm = new Unit('FT/SM', climb_angle, 0.3048 / 1609.344);
var feet_per_nm = new Unit('FT/NM', climb_angle, 0.3048 / 1852.0);

// altitude
var altitude = new Dimension('altitude', 0, 'M'); // base unit is meters
var altitude_meters = new Unit('M', altitude);
var altitude_feet = new Unit('FT', altitude, 0.3048);

// length
var length = new Dimension('length', 2, 'M'); // base unit is meters
//var length_meters = new Unit('M', length, 0.0254);
var length_meters = new Unit('M', length);
var length_feet = new Unit('FT', length, 0.3048);
var length_cm = new Unit('CM', length, 0.01);
var length_inches = new Unit('IN', length, 0.0254);

// distance - all (for unit conversions)
var distance_all = new Dimension('distance all', 2, 'M'); // base unit is meters
var dist_nm = new Unit('NM', distance_all, 1852.0);
var dist_sm = new Unit('SM', distance_all, 1609.344);
var dist_feet = new Unit('FT', distance_all, 0.3048);
var dist_inches = new Unit('IN', distance_all, 0.0254);
var dist_km = new Unit('KM', distance_all, 1000);
var dist_meters = new Unit('M', distance_all);
var dist_cm = new Unit('CM', distance_all, 0.01);

// rate
var fuel_rate = new Dimension('rate', 2, '/S'); // base unit is per second
var lph = new Unit('LPH', fuel_rate, 1.0 / 3600.0);
var us_gph = new Unit('US GPH', fuel_rate, 3.7854118 / 3600.0);
var uk_gph = new Unit('UK GPH', fuel_rate, 4.54609 / 3600.0);

// time (duration)
var duration = new Dimension('duration', 2, 'S'); // base unit is seconds
var seconds = new Unit('S', duration);
var minutes = new Unit('MIN', duration, 60.0);
var hours = new Unit('HR', duration, 3600.0);
var hms = new Unit('HMS', duration, 1, 0, FORMAT.HMS);

// time (24 hour clock)
// TODO: set local/dest defaults to UTC
var time = new Dimension('time', 0, 'S'); // base unit is seconds
var time_utc = new Unit('UTC', time, 1, 0, FORMAT.CLK_HMS);
var time_local = new Unit('UTC', time, 1, 0, FORMAT.CLK_HMS);
var time_dest = new Unit('UTC', time, 1, 0, FORMAT.CLK_HMS);

// volume
var volume = new Dimension('volume', 2, 'L'); // base unit is liters
var liters = new Unit('L', volume);
var us_gallons = new Unit('US GAL', volume, 3.7854118);
var uk_gallons = new Unit('UK GAL', volume, 4.54609);
var us_quarts = new Unit('US QT', volume, 0.94635295);
var uk_quarts = new Unit('UK QT', volume, 1.1365225);

// weight
var weight = new Dimension('weight', 2, 'KG'); // base unit is KG
var kilograms = new Unit('KG', weight);
var us_pounds = new Unit('LBS', weight, 0.45359237);

// fuel rate - weight/duration
var fuel_wt_rate = new Dimension('weight rate', 2, 'KG/S'); // base unit is KG / S
var kilograms_hr = new Unit('KG/HR', fuel_wt_rate, 1.0 / 3600.0);
var us_pounds_hr = new Unit('LBS/HR', fuel_wt_rate, 0.45359237 / 3600.0);

// fuel type base unit KG/L)
var fuel_type = new Dimension('fuel type', 0, 'KG/L'); // base unit KG/L
var av_gas = new Unit('Av Gas', fuel_type, 6.0);
var jet_fuel = new Unit('Jet Fuel', fuel_type, 6.84);
var oil = new Unit('Oil', fuel_type, 7.5);

// temperature
var temperature = new Dimension('temperature', 0, '\u00b0K'); // base unit is Kelvin
var temperature_celsius = new Unit('\u00b0C', temperature, 1.0, 273.15); // absolute T
var temperature_fahrenheit = new Unit(
    '\u00b0F',
    temperature,
    5.0 / 9.0,
    255.3722222,
);

var temperature_delta = new Dimension('delta_temperature', 1, '\u00b0K'); // base unit is Kelvin
var delta_celsius = new Unit('\u00b0C', temperature_delta); // delta T
var delta_fahrenheit = new Unit('\u00b0F', temperature_delta, 5.0 / 9.0);

// torque
var torque = new Dimension('torque', 2, 'NM'); // base unit is newton-meters
var newton_meter = new Unit('KG M', torque); // netwton-meter = killogram-meter
var pound_inch = new Unit('LB-IN', torque, 0.0115212462);

// angle: 0 to 360
var angle = new Dimension('angle', 0, 'RAD'); // base unit is radians
var degrees_angle = new Unit('\u00b0', angle, 0.01745329, 0, FORMAT._360); // 180 / pi

// angle: +/- 180
var angle_180 = new Dimension('angle_180', 0, 'RAD'); // base unit is radians
var degrees_180 = new Unit('\u00b0', angle_180, 0.01745329, 0, FORMAT._180); // 180 / pi

// angle - DMS
var angle_dms = new Dimension('angle_dms', 1, 'RAD'); // base unit is radians
var degrees_dms = new Unit('\u00b0', angle_dms, 0.01745329, 0, FORMAT._360); // 180 / pi
var dms_dms = new Unit('DMS', angle_dms, 0.01745329 / 3600, 0, FORMAT.DMS); // (180 / pi)/3600 (1 deg = 3600 seconds)

// runway - in deca-degrees (display no unit)
var runway = new Dimension('runway', 0, 'RAD'); // base unit is radians
var runway_deca_degrees = new Unit(' ', runway, 10 * 0.01745329); // 10 * (180 / pi)

// pressure
var pressure = new Dimension('pressure', 2, 'MBAR');
var millibar = new Unit('MB', pressure, 1);
var inHg = new Unit('IN HG', pressure, 1000 / 29.53);

// ratio
var ratio = new Dimension('ratio', 1, ''); // This is dimensionless?
var to_one = new Unit(':1', ratio);

// percent
var percent = new Dimension('percent', 1, '');
var percent_unit = new Unit('%', percent, 0.01);

// Mach
var mach = new Dimension('mach', 3, '');
var mach_ratio = new Unit(' ', mach);

// item
var item = new Dimension('item', 0, '');
var item_noText = new Unit(' ', item);
var item_add = new Unit('Add', item);
var item_remove = new Unit('Remove', item);

// Holding Pattern - Entry Type
var entry = new Dimension('entry', 0, '');
var entry_noText = new Unit(' ', entry);
var entry_direct = new Unit('Direct', entry);
var entry_parallel = new Unit('Parallel', entry);
var entry_teardrop = new Unit('Teardrop', entry);

// Holding Pattern - Turn direction
var turn_dir = new Dimension('turn', 0, '');
var turn_right = new Unit('Right', turn_dir);
var turn_left = new Unit('Left', turn_dir);

// instrument calibration - dimensionless with 2 decimal places
var calibration = new Dimension('', 2, '');
var calUnit = new Unit(' ', calibration);

// dimensionless
var noDimension = new Dimension('', 0, '');
var noUnit = new Unit(' ', noDimension);

////////////////////////////////////////////////////////////////////////////////////////
// Default Units - default unit pointer to initialize or globally set the unit for each dimension
// TODO: move to separate file and allow compiler flags to set different default units
//     (e.g. american or metric or UK)
CONST.GroundSpeedDefault = knots_gs;
CONST.AirSpeedDefault = knots_as;

CONST.DistanceDefault = nm;
CONST.AltitudeDefault = altitude_feet;
CONST.LengthDefault = length_inches;
CONST.DistAllDefault = dist_nm; //equation uses CONST.DistanceDefault (create unique equation is needed)

CONST.DurationDefault = hours;
CONST.TimeDefault = time_local; //Trip planner depart, ETA
CONST.TimeDefaultHMS = hms; //Trip planner ETE

CONST.TemperatureDefault = temperature_fahrenheit;
CONST.PressureDefault = inHg;
CONST.VolumeDefault = us_gallons;
CONST.FuelRateDefault = us_gph;
CONST.FuelWtRateDefault = us_pounds_hr;
CONST.WeightDefault = us_pounds;
CONST.ClimbRateDefault = ft_per_min_cr;
CONST.ClimbAngeDefault = feet_per_nm;
CONST.TorqueDefault = pound_inch;

CONST.AngleDefault = degrees_angle;
CONST.Angle180Default = degrees_180;
CONST.AngleDMSDefault = dms_dms;
CONST.RunwayDefault = runway_deca_degrees; // N/A - input only, no unit change (remove??)

CONST.RatioDefault = to_one;
CONST.PercentDefault = percent_unit;
CONST.MachDefault = mach_ratio;

////////////////////////////////////////////////////////////////////////////////////////
// Dimensions/Units for Settings
// Theme
var theme = new Dimension('theme', 0, '');
var theme_black = new Unit('Standard', theme);
var theme_color = new Unit('Night', theme);
var theme_white = new Unit('Daylight', theme);

// Backlight
var backlight = new Dimension('backlight', 0, '');
var backlight_normal = new Unit('Normal', backlight);
var backlight_daylight = new Unit('Daylight', backlight);
var backlight_night = new Unit('Night', backlight);
var backlight_dusk = new Unit('Dusk', backlight);

// Scroll/Slider Function
var slider = new Dimension('slider', 0, '');
var slider_both = new Unit('Slide or Tap', slider);
var slider_slide = new Unit('Slide', slider);
var slider_tap = new Unit('Tap', slider);

// Scroll Speed
var scroll = new Dimension('scroll', 0, '');
var scroll_slow = new Unit('Slow', scroll);
var scroll_med = new Unit('Medium', scroll);
var scroll_fast = new Unit('Fast', scroll);

// Default Units - set to standard (US or Metric) or customise
// NOTE: currently NOT using custom units - not compatible with changing similiar units
var defaultUnits = new Dimension('def units', 0, '');
var units_us = new Unit('U. S.', defaultUnits);
var units_metric = new Unit('Metric', defaultUnits);
var units_custom = new Unit('Custom', defaultUnits);

// Change Units - change all on screen (same and similar) or individual
var unitChange = new Dimension('unit change', 0, '');
var change_eq_screen = new Unit('Per Screen', unitChange);
var change_individual = new Unit('Individually', unitChange);

// User Data - save user data to or recall from NV data
var userData = new Dimension('user data', 0, '');
var userData_cancel = new Unit('Cancel', userData);
var userData_save = new Unit('Save', userData);
var userData_recall = new Unit('Recall', userData);

var aircraft_valid_type = new Dimension('aircraft valid', 0, '');
var valid_off = new Unit('off', aircraft_valid_type);
var valid_on = new Unit('on', aircraft_valid_type);
