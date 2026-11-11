///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 921 $
// @date    $Date: 2013-06-28 14:10:19 -0700 (Fri, 28 Jun 2013) $
// @brief
//
//#include "observable.h"
//#include "variables.h"
//#include "definedUnits.h"
//#include "CX3Equations.h"

// maximum items & variable/item (for weight and balance equations)
// and points (for Rhumb line equations) here
CONST.MAX_ITEMS = 8;
CONST.VARIABLES_PER_ITEM = 3; // inputs per item (weight, arm, moment)
CONST.ITEMS_OUTPUT_EQUATIONS = 9; // weight & balance output, intermediate, and dummy euqations
CONST.MAX_RHUMB_ITEMS = 7; // 4 points + 3 rhumb lines

// trip planner legs & number of leg inputs
CONST.MAX_TRIP_PLAN_LEGS = 5;
CONST.TRIP_LEG_INPUTS = 9;
CONST.TRIP_LEG_VARIABLES = 18;

// altitude
var IndAlt = new Variable('IAlt', altitude);
var PressAlt = new Variable('PAlt', altitude);
var DensAlt = new Variable('DAlt', altitude);
var CloudBase = new Variable('AGL', altitude);
var AltChange = new Variable('Desc', altitude);
var StdAtmAltitude = new Variable('Alt', altitude); // Used in the atmospheric model
var Altitude = new Variable('Altitude', altitude); // Used in 'set default units'

// distance
var Distance = new Variable('Dist', distance);
var DistSetUnit = new Variable('Distance', distance); // set default units
var DistanceAll = new Variable('Dist', distance_all); //convert units
var DistanceAB = new Variable('Dist', distance); // Rhumb Line
var DistanceBC = new Variable('Dist', distance);
var DistanceCD = new Variable('Dist', distance);
var Distance1 = new Variable('Dist', distance); // Trip Planner -input to total trip output
var Distance2 = new Variable('Dist', distance, false, false); // default item1 active, all others inactive
var Distance3 = new Variable('Dist', distance, false, false);
var Distance4 = new Variable('Dist', distance, false, false);
var Distance5 = new Variable('Dist', distance, false, false);
var DistanceTotal = new Variable('Dist', distance, true); //total distance read only

// length
var Length = new Variable('Length', length); // set default units
var MomArm = new Variable('Len', length); // This is an array?
var ChangeCG = new Variable('\176CG', length); // TODO: need abbreviation. delta-CG
var ChangeArm = new Variable('\176Arm', length); // TODO: need abbreviation. delta-Arm

// speed
var CalAirspd = new Variable('CAS', air_speed);
var TrueAirspd = new Variable('TAS', air_speed);
var WindSpeed = new Variable('WSpd', air_speed);
var CrossWind = new Variable('X Wnd', air_speed, true); //TODO: X/H winds read only? (implemented as read only)
var HeadWind = new Variable('H Wnd', air_speed, true);
var GrndSpeed = new Variable('GS', ground_speed);
var Speed = new Variable('Spd', ground_speed); // used for 'convert units'
var GSpeed = new Variable('Ground Speed', ground_speed); // used for 'set default units'
var ASpeed = new Variable('Air Speed', air_speed); // used for 'set default units'
var TrueAirspd1 = new Variable('TAS', air_speed); // Trip Planner
var TrueAirspd2 = new Variable('TAS', air_speed);
var TrueAirspd3 = new Variable('TAS', air_speed);
var TrueAirspd4 = new Variable('TAS', air_speed);
var TrueAirspd5 = new Variable('TAS', air_speed);
var GrndSpeed1 = new Variable('GS', ground_speed, true); //Trip Planner - GS is output & read only
var GrndSpeed2 = new Variable('GS', ground_speed, true);
var GrndSpeed3 = new Variable('GS', ground_speed, true);
var GrndSpeed4 = new Variable('GS', ground_speed, true);
var GrndSpeed5 = new Variable('GS', ground_speed, true);
var WindSpeed1 = new Variable('WSpd', air_speed);
var WindSpeed2 = new Variable('WSpd', air_speed);
var WindSpeed3 = new Variable('WSpd', air_speed);
var WindSpeed4 = new Variable('WSpd', air_speed);
var WindSpeed5 = new Variable('WSpd', air_speed);

// Temperature
var TrueTemp = new Variable('OAT', temperature);
var DewPoint = new Variable('Dewp', temperature);
var IndTemp = new Variable('TAT', temperature);
var StdAtmTemperature = new Variable('OAT', temperature, true); // Used in the atmospheric model, 'read-only'
var Temperature = new Variable('Temp', temperature);
var TempSetDefault = new Variable('Temperature', temperature);

// other rates
var FuelRate = new Variable('Rate', fuel_rate);
var Rate = new Variable('Rate', fuel_rate);
var FuelRate1 = new Variable('Fuel Rate', fuel_rate); // Trip Planner
var FuelRate2 = new Variable('Fuel Rate', fuel_rate);
var FuelRate3 = new Variable('Fuel Rate', fuel_rate);
var FuelRate4 = new Variable('Fuel Rate', fuel_rate);
var FuelRate5 = new Variable('Fuel Rate', fuel_rate);

// length
var CG = new Variable('CG', length, true);
var MacCG = new Variable('CG', length); //%MAC - different variable than weight & balance, +editable
var LEMAC = new Variable('LMAC', length);
var MAC = new Variable('MAC', length);
var AircraftArm = new Variable('Arm', length); // Aircraft Profile variables used in Weight and Balance equations
var AircraftCG = new Variable('CG', length, true);
var FuelArm = new Variable('Arm', length);
var FuelAux = new Variable('Fuel Aux', length);
var PilotArm = new Variable('Pilot', length);
var FrontPsgrArm = new Variable('Pax 1', length);
var RearPsgrArm = new Variable('Pax 2', length);
var Cargo1Arm = new Variable('Cargo 1', length);
var Cargo2Arm = new Variable('Cargo 2', length);
var Custom1Arm = new Variable('Custom 1', length);
var Custom2Arm = new Variable('Custom 2', length);
var Custom3Arm = new Variable('Custom 3', length);
var ArmA = new Variable('Arm', length); //variables used in Weight and Balance equations
var ArmB = new Variable('Arm', length);
var ArmC = new Variable('Arm', length);
var ArmD = new Variable('Arm', length);
var Arm1 = new Variable('Arm', length); //item arms for Weight and Balance equations
var Arm2 = new Variable('Arm', length);
var Arm3 = new Variable('Arm', length);
var Arm4 = new Variable('Arm', length);
var Arm5 = new Variable('Arm', length);
var Arm6 = new Variable('Arm', length);
var Arm7 = new Variable('Arm', length);
var Arm8 = new Variable('Arm', length);
CONST.ITEM_ARM = [Arm1, Arm2, Arm3, Arm4, Arm5, Arm6, Arm7, Arm8];

// volume
var FuelVol = new Variable('Vol', volume);
var OilVol = new Variable('Vol', volume);
var FuelVol1 = new Variable('Fuel', volume, true); // Trip Planner - fuel volume is output and read only
var FuelVol2 = new Variable('Fuel', volume, true, false); // fuel volume is also input to total trip output
var FuelVol3 = new Variable('Fuel', volume, true, false); // default item1 active, all others inactve
var FuelVol4 = new Variable('Fuel', volume, true, false);
var FuelVol5 = new Variable('Fuel', volume, true, false);
var FuelVolTotal = new Variable('Fuel', volume, true);
var AircraftFuelVol = new Variable('Fuel', volume); // for Weight and Balance using aircraft profile
var Volume = new Variable('Vol', volume);

// weight
var FuelWt = new Variable('Wt', weight);
var Weight = new Variable('Wt', weight);
var AircraftFuelWt = new Variable('Fuel', weight); // aircraft profile - weight & balance variables
var AircraftWeight = new Variable('Wt', weight);
var PilotWeight = new Variable('Pilot', weight);
var FrontPsgrWeight = new Variable('Pax 1', weight);
var RearPsgrWeight = new Variable('Pax 2', weight);
var Cargo1Weight = new Variable('Cargo 1', weight);
var Cargo2Weight = new Variable('Cargo 2', weight);
var Custom1Weight = new Variable('Custom 1', weight);
var Custom2Weight = new Variable('Custom 2', weight);
var Custom3Weight = new Variable('Custom 3', weight);
var AircraftTotalWeight = new Variable('Wt', weight, true);
var AircraftWeightA = new Variable('Wt', weight, true);
var ShiftItemWeight = new Variable('Item Wt', weight); //for 'Weight & Shift Formula'
var ShiftTotalWeight = new Variable('Total Wt', weight);
var TotalWeight = new Variable('Wt', weight, true); // for Weight & Balance - read only
var TotalWeightA = new Variable('Wt', weight, true);
var TotalWeightB = new Variable('Wt', weight, true);
var WeightA = new Variable('Wt', weight); //variables used in Weight and Balance equations
var WeightB = new Variable('Wt', weight);
var WeightC = new Variable('Wt', weight);
var WeightD = new Variable('Wt', weight);
var Weight1 = new Variable('Wt', weight); //item weights for Weight and Balance equations
var Weight2 = new Variable('Wt', weight); //NOTE: copy to/from variables used in equations
var Weight3 = new Variable('Wt', weight);
var Weight4 = new Variable('Wt', weight);
var Weight5 = new Variable('Wt', weight);
var Weight6 = new Variable('Wt', weight);
var Weight7 = new Variable('Wt', weight);
var Weight8 = new Variable('Wt', weight);
CONST.ITEM_WEIGHT = [
    Weight1,
    Weight2,
    Weight3,
    Weight4,
    Weight5,
    Weight6,
    Weight7,
    Weight8,
];

// fuel rate - weight/duration
var FuelWtRate = new Variable('Rate', fuel_wt_rate);

// fuel type
var FuelType = new Variable('Type', fuel_type);
var AircraftFuelType = new Variable('Type', fuel_type); //aircraft profile weight & balance variable

// torque
var Torque = new Variable('Torq', torque);
var AircraftMom = new Variable('Mom', torque); //aircraft profile weight and balance variables
var FuelMom = new Variable('Mom', torque);
var PilotMom = new Variable('Mom', torque);
var FrontPsgrMom = new Variable('Mom', torque);
var RearPsgrMom = new Variable('Mom', torque);
var Cargo1Mom = new Variable('Mom', torque);
var Cargo2Mom = new Variable('Mom', torque);
var Custom1Mom = new Variable('Mom', torque);
var Custom2Mom = new Variable('Mom', torque);
var Custom3Mom = new Variable('Mom', torque);
var AircraftTotalMom = new Variable('Mom', torque, true); // aircraft profile weight and balance totals
var AircraftTotalMomA = new Variable('Mom', torque, true);
var TotalMom = new Variable('Mom', torque, true); //weight and balance totals
var TotalMomA = new Variable('Mom', torque, true);
var TotalMomB = new Variable('Mom', torque, true);
var MomA = new Variable('Mom', torque); //variables used in Weight and Balance equations
var MomB = new Variable('Mom', torque);
var MomC = new Variable('Mom', torque);
var MomD = new Variable('Mom', torque);
var Mom1 = new Variable('Mom', torque); //item weights for Weight and Balance equations
var Mom2 = new Variable('Mom', torque);
var Mom3 = new Variable('Mom', torque);
var Mom4 = new Variable('Mom', torque);
var Mom5 = new Variable('Mom', torque);
var Mom6 = new Variable('Mom', torque);
var Mom7 = new Variable('Mom', torque);
var Mom8 = new Variable('Mom', torque);
CONST.ITEM_MOM = [Mom1, Mom2, Mom3, Mom4, Mom5, Mom6, Mom7, Mom8];

// angle
var Angle = new Variable('Angle', angle_dms);
var CompHding = new Variable('CHdg', angle);
var Deviation = new Variable('Dev', angle_180); // magnetic deviation (+/- 180)
var TrueCourse = new Variable('TCrs', angle);
var TrueHeading = new Variable('THdg', angle);
var VarEW = new Variable('Var', angle_180); // magnetic variation (+/- 180)
var MagneticHeading = new Variable('MHdg', angle, true);
var WindDir = new Variable('WDir', angle);
var From = new Variable('From', angle); // course From a location
var To = new Variable('To', angle); // course To a location (= From - 180 deg)
var WCA = new Variable('WCA', angle_180, true); // Wind Correction Angle, read-only
var HoldPatHeading = new Variable('Head', angle);
var HoldingRadical = new Variable('Hold', angle);
var InboundHeading = new Variable('Inbound', angle, true); // Holding Pattern Inbound Heading - read only
var TrueCourseAB = new Variable('TCrs', angle); // Rhumb Line true course, latitude & longitude
var TrueCourseBC = new Variable('TCrs', angle);
var TrueCourseCD = new Variable('TCrs', angle);
var LatitudeA = new Variable('Lat', angle_dms);
var LatitudeB = new Variable('Lat', angle_dms);
var LatitudeC = new Variable('Lat', angle_dms);
var LatitudeD = new Variable('Lat', angle_dms);
var LongitudeA = new Variable('Long', angle_dms);
var LongitudeB = new Variable('Long', angle_dms);
var LongitudeC = new Variable('Long', angle_dms);
var LongitudeD = new Variable('Long', angle_dms);
var StartLatitude = new Variable('Lat', angle_dms);
var StartLongitude = new Variable('Long', angle_dms);
var EndLatitude = new Variable('Lat', angle_dms);
var EndLongitude = new Variable('Long', angle_dms);
var TrueCourse1 = new Variable('TCrs', angle); // Trip Planner
var TrueCourse2 = new Variable('TCrs', angle);
var TrueCourse3 = new Variable('TCrs', angle);
var TrueCourse4 = new Variable('TCrs', angle);
var TrueCourse5 = new Variable('TCrs', angle);
var WindDir1 = new Variable('WDir', angle);
var WindDir2 = new Variable('WDir', angle);
var WindDir3 = new Variable('WDir', angle);
var WindDir4 = new Variable('WDir', angle);
var WindDir5 = new Variable('WDir', angle);
var VarEW1 = new Variable('Var', angle_180);
var VarEW2 = new Variable('Var', angle_180);
var VarEW3 = new Variable('Var', angle_180);
var VarEW4 = new Variable('Var', angle_180);
var VarEW5 = new Variable('Var', angle_180);
var Deviation1 = new Variable('Dev', angle_180);
var Deviation2 = new Variable('Dev', angle_180);
var Deviation3 = new Variable('Dev', angle_180);
var Deviation4 = new Variable('Dev', angle_180);
var Deviation5 = new Variable('Dev', angle_180);
var CompHding1 = new Variable('CH', angle, true); // trip planner - output & read only
var CompHding2 = new Variable('CH', angle, true);
var CompHding3 = new Variable('CH', angle, true);
var CompHding4 = new Variable('CH', angle, true);
var CompHding5 = new Variable('CH', angle, true);
var MagneticHding1 = new Variable('MH', angle, true);
var MagneticHding2 = new Variable('MH', angle, true);
var MagneticHding3 = new Variable('MH', angle, true);
var MagneticHding4 = new Variable('MH', angle, true);
var MagneticHding5 = new Variable('MH', angle, true);
var TrueHeading1 = new Variable('TH', angle, true);
var TrueHeading2 = new Variable('TH', angle, true);
var TrueHeading3 = new Variable('TH', angle, true);
var TrueHeading4 = new Variable('TH', angle, true);
var TrueHeading5 = new Variable('TH', angle, true);
var WCA1 = new Variable('WCA', angle_180, true);
var WCA2 = new Variable('WCA', angle_180, true);
var WCA3 = new Variable('WCA', angle_180, true);
var WCA4 = new Variable('WCA', angle_180, true);
var WCA5 = new Variable('WCA', angle_180, true);

// runway (in deca-degrees)
var Runway = new Variable('Runway', runway);

// duration
var DurationCU = new Variable('Dur', duration); //unit conversions
var LegTime = new Variable('Dur', duration);
var LegTime1 = new Variable('ETE', duration, true); // trip planner - output & read only
var LegTime2 = new Variable('ETE', duration, true, false); // also input to total trip output
var LegTime3 = new Variable('ETE', duration, true, false); // default item1 active, all others inactive
var LegTime4 = new Variable('ETE', duration, true, false);
var LegTime5 = new Variable('ETE', duration, true, false);
var LegTimeTotal = new Variable('ETE', duration, true);

// TODO add timers

// date/time
// TODO add timezone, etc.
var Duration = new Variable('Dur', duration);
var ETA = new Variable('ETA', time);
var LegStart = new Variable('Dep', time);
var LegStart1 = new Variable('Depart', time); //trip planner
var LegStart2 = new Variable('Depart', time);
var LegStart3 = new Variable('Depart', time);
var LegStart4 = new Variable('Depart', time);
var LegStart5 = new Variable('Depart', time);
var ETA1 = new Variable('ETA', time, true); // trip planner - output & read only
var ETA2 = new Variable('ETA', time, true, false); // also input to total trip output
var ETA3 = new Variable('ETA', time, true, false); // default item1 active, all others inactive
var ETA4 = new Variable('ETA', time, true, false);
var ETA5 = new Variable('ETA', time, true, false);
var ETAtotal = new Variable('ETA', time, true);
var TimeUTC = new Variable('UTC', time);
var TimeLocal = new Variable('Local', time);
var TimeDest = new Variable('Destination', time);
var ClockUpdate = new Variable('Local', time);
var TimerUpdate = new Variable('Timer', time);

// pressure
var Pressure = new Variable('Pres', pressure);
var BarPressure = new Variable('Baro', pressure);
var StdAtmPressure = new Variable('Baro', pressure);

// ratios
var GlideRatio = new Variable('Rat', ratio);
var MACH = new Variable('MACH', mach);
var PercentMAC = new Variable('%MAC', percent);
var AngleOfClimb = new Variable('AoC/D', climb_angle);
var ClimbAngle = new Variable('AoC/D', climb_angle);
var RateOfClimb = new Variable('RoC/D', climb_rate);
var ClimbRate = new Variable('RoC/D', climb_rate);

// items
var TripOutput = new Variable('CALCULATED VALUES', item);
var Item1 = new Variable('ITEM 1', item);
var Item2 = new Variable('ITEM 2', item);
var Item3 = new Variable('ITEM 3', item);
var Item4 = new Variable('ITEM 4', item);
var Item5 = new Variable('ITEM 5', item);
var Item6 = new Variable('ITEM 6', item);
var Item7 = new Variable('ITEM 7', item);
var Item8 = new Variable('ITEM 8', item);
var Totals = new Variable('TOTALS', item, true);
CONST.ITEMS = [Item1, Item2, Item3, Item4, Item5, Item6, Item7, Item8];
var PointA = new Variable('POINT: A', item);
var PointB = new Variable('POINT: B', item);
var PointC = new Variable('POINT: C', item);
var PointD = new Variable('POINT: D', item);
var RhumbLineAB = new Variable('RHUMB LINE: AB', item); //TODO: change back to "RHUMB LINE:AB
var RhumbLineBC = new Variable('RHUMB LINE: BC', item);
var RhumbLineCD = new Variable('RHUMB LINE: CD', item);
CONST.RHUMB_LINES = [
    PointA,
    RhumbLineAB,
    PointB,
    RhumbLineBC,
    PointC,
    RhumbLineCD,
    PointD,
];

// Holding Pattern - Entry Type
var EntryType = new Variable('Entry', entry, true);

// Holding Pattern - Turn direction
var TurnDir = new Variable('Turn Dir', turn_dir);

// dimensionless
var ReductionFactor = new Variable('RF', noDimension); // used by Weight & Balance equations
var AircraftRF = new Variable('RF', noDimension); // aircraft profile RF (for Weight and Balance)
var NumberItems = new Variable('#Items', noDimension);
var SetTimezone = new Variable('Set Timezone', noDimension);
var RecoveryFactor = new Variable('K', calibration, true); // used by airspeed equations (default 1.0, read only)
var ProfileRecoveryFactor = new Variable('K', calibration); // aircraft profile - sets RecoveryFactor (0.7 to 1.0)
var AircraftWtBalProfile = new Variable(
    'Weight & Balance Profile',
    noDimension,
); //label

// var AircraftWtBal = new Variable("Profile Valid", noDimension);      // aircraft profile valid
//var AircraftWtBal = new Variable("Profile Valid", aircraft_valid_type, true);      // aircraft profile valid. allows input./
var AircraftWtBal = new Variable('Profile Valid', aircraft_valid_type, false); // aircraft profile valid. allows input./
var ShouldUseProfileForWtBalCalcs = new Variable(
    'Use Profile in Wt/Bal',
    aircraft_valid_type,
    false,
); // aircraft profile valid. allows input./

var AircraftEmpty = new Variable('Empty Aircraft', noDimension); // aircraft profile - Empty Aircraft
var AircraftFuel = new Variable('Fuel', noDimension); // aircraft profile - Fuel
var AircraftItems = new Variable('Individual Item Arms', noDimension); // aircraft profile - Pilot, Passengers, and Cargo
var AircraftCargo = new Variable('Cargo', noDimension); // aircraft profile -intermediate to check for valid arms (more than 4)
var Calibration = new Variable('Instrument Calibration', noDimension); // aircraft profile - instrument calibration

// Settings
var Theme = new Variable('Theme', theme);
var Backlight = new Variable('Backlighting', backlight);
var ScrollFunction = new Variable('Slider', slider);
var ScrollSpeed = new Variable('Scroll Speed', scroll);
var DefaultUnits = new Variable('Default Units', defaultUnits);
var UnitChange = new Variable('Unit Changes', unitChange);
var Clock = new Variable('Time Set', time);
var Favorite = new Variable('Select Favorite', noDimension);
var AircraftProfile = new Variable('Aircraft Profile', noDimension);
var UserData = new Variable('User Data', userData);
var FirmwareVersion = new Variable('Version', noDimension, true); // version is read-only
var ZoneLocal = new Variable('Local Timezone (Standard Time)', noDimension);
var ZoneDest = new Variable(
    'Destination Timezone (Standard Time)',
    noDimension,
);

// NOTE: any changes to settings needs to be matched in SettingID_t in CX3Settings.h
CONST.SETTINGS = [
    Theme,
    Backlight,
    //ScrollFunction,
    //ScrollSpeed,
    Clock,
    DefaultUnits,
    UnitChange,
    Favorite,
    AircraftProfile, // part of aircraft profile
    UserData,
    FirmwareVersion,
    ZoneLocal,
    ZoneDest,
];
