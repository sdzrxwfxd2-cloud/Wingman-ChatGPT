///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 924 $
// @date    $Date: 2013-07-15 13:42:56 -0700 (Mon, 15 Jul 2013) $
// @brief   Global definitions for the equations used in the calculator
//
//#include "CX3Equations.h"
//#include "definedVariables.h"
//#include "GroundSpeedEquations.h"
//#include "AltitudeEquations.h"
//#include "CloudBaseEquations.h"
//#include "StdAtmosphereEquations.h"
//#include "FuelEquations.h"
//#include "GlideEquations.h"
//#include "CompassHeadingEquations.h"
//#include "WindCorrectionEquations.h"
//#include "AirSpeedEquations.h"
//#include "WeightAndBalanceEquations.h"
//#include "RhumbLineEquations.h"
//#include "TripPlannerEquations.h"

// Some constants used throughout the equations

CONST.g = 9.80665; // Gravity (m/s2)
CONST.M = 0.0289644; // Molar mass of Earth's air (kg/mol)
CONST.R = 8.31432; // Universal gas constant for air (N*m/mol*K)
CONST.L = 0.0065; // standard temperature lapse rate for troposphere (K/m)
CONST.gMRL = (CONST.g * CONST.M) / (CONST.R * CONST.L); // ~5.25587611
CONST.inv_gMRL = 1 / CONST.gMRL; // ~0.19026324;

// Standard temperature
CONST.Tstd = 273.15;

// Standard temperature in the atmospheric model (which is 15 C)
CONST.Tstd_atm = 288.15;

// Standard temperature (atmospheric) divided by lapse rate
CONST.Tstd_div_L = CONST.Tstd_atm / CONST.L;

// Standard Pressure in millbar
CONST.StdPressure_mb = 1013.25;

// ratio of specific heats for air
// TODO: verify (copied from CX-2)
CONST.Gamma = 1.4;

// Standard Speed of Sound (at 0 m -> 15 C)
CONST.CS_0 =
    Math.sqrt((CONST.Gamma * CONST.R) / CONST.M) * Math.sqrt(CONST.Tstd_atm);

// PI
CONST.PI = 3.1415926535897932;

// Tol: For Rhumb Line equations
//    TOL is a small number of order machine precision- say 1e-15.
//    This tests to avoid 0/0 indeterminacies on E-W courses.
CONST.Tol = 0.00000001;

// Data for atmosphere layers from the US standard model (1976)
CONST.atmLayerData = [
    buildAtmosphericLayerData(0, 11000, 1013.25, 226.321, 288.15, -0.0065), // Troposphere
    buildAtmosphericLayerData(11000, 20000, 226.321, 54.7489, 216.65, 0), // Tropopause
    buildAtmosphericLayerData(20000, 32000, 54.7489, 8.68019, 216.65, 0.001), // Stratosphere
    buildAtmosphericLayerData(32000, 47000, 8.68019, 1.10906, 228.65, 0.0028), // Stratopause
    buildAtmosphericLayerData(47000, 51000, 1.10906, 0.669389, 270.65, 0), // Mesosphere
    buildAtmosphericLayerData(51000, 71000, 0.669389, 0.0395642, 270.65, -0.0028), // Mesopause
    buildAtmosphericLayerData(71000, 84852, 0.0395642, 0.0037338, 214.65, -0.002), // Thermosphere
];

// aircraft profile input items: fuel (vol); pilot, 2 passenger, 2 cargo (weights)
CONST.MAX_AIRCRAFT_INPUT_ITEMS = 9;
// aircraft profile output items: totals, RF, weight, CG, moment
CONST.MAX_AIRCRAFT_OUTPUT_ITEMS = 5;
// aircraft profile all variables (equation outputs): input, output, intermediate and dummy equations
CONST.ALL_AIRCRAFT_VARIABLES = 15;

///////////////////////////////////////////////////////////////////////////////
/// Variables

// Weight & Balance
// currently storing prefered units separately
//Unit const  *ItemUnits[MAX_ITEMS+1];
var ItemUnits = new Array(CONST.MAX_ITEMS + 1);
//uint8_t ItemStatus[MAX_ITEMS];
var ItemStatus = new Array(CONST.MAX_ITEMS);
//uint8_t ItemsActive;
var ItemsActive = 0;
//uint8_t ItemActiveMax;
var ItemActiveMax = 0;

//uint8_t RhumbItemStatus[MAX_RHUMB_ITEMS];
var RhumbItemStatus = new Array(CONST.MAX_RHUMB_ITEMS);

///////////////////////////////////////////////////////////////////////////////
/// Equations

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// GroundSpeed
var computeSpeed = new ComputeSpeedFromDistanceAndTime(
    GrndSpeed,
    Distance,
    Duration,
);
var computeDistance = new ComputeDistanceFromSpeedAndTime(
    Distance,
    GrndSpeed,
    Duration,
);
var computeTime = new ComputeTimeFromDistanceAndSpeed(
    Duration,
    Distance,
    GrndSpeed,
);

CONST.groundspeedEqus = [computeSpeed, computeDistance, computeTime];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Altitude
var computeIndicatedAlt = new ComputeIaltFromBarPresAndPalt(
    IndAlt,
    BarPressure,
    PressAlt,
);
var computeBarPressure = new ComputeBarPresFromIaltAndPalt(
    BarPressure,
    IndAlt,
    PressAlt,
);
var computePressureAlt = new ComputePAltFromIaltAndBarPressure(
    PressAlt,
    IndAlt,
    BarPressure,
);
var computeDensityAltitude = new ComputeDensAltFromPAltAndTemp(
    DensAlt,
    PressAlt,
    TrueTemp,
);
var computePressureAlt2 = new ComputePressAltFromDensAltAndTemp(
    PressAlt,
    DensAlt,
    TrueTemp,
);
var computeTemperature = new ComputeTempFromDensAltAndPressAlt(
    TrueTemp,
    DensAlt,
    PressAlt,
);

CONST.altitudeEqus = [
    computePressureAlt,
    computeIndicatedAlt,
    computeBarPressure,
    computeDensityAltitude,
    computePressureAlt2,
    computeTemperature,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Airspeed
var computeMachFromTASAndTrueTemp = new ComputeMachFromTASAndTrueTemp(
    MACH,
    TrueAirspd,
    TrueTemp,
);
var computeTrueTempFromIndTempAndMach = new ComputeTrueTempFromIndTempAndMach(
    TrueTemp,
    IndTemp,
    MACH,
    RecoveryFactor,
);
var computeIndTempFromTrueTempAndMach = new ComputeIndTempFromTrueTempAndMach(
    IndTemp,
    TrueTemp,
    MACH,
    RecoveryFactor,
);
var computeTrueTempFromIndTempAndTAS = new ComputeTrueTempFromIndTempAndTAS(
    TrueTemp,
    IndTemp,
    TrueAirspd,
    RecoveryFactor,
);
var computeIndTempFromTrueTempAndTAS = new ComputeIndTempFromTrueTempAndTAS(
    IndTemp,
    TrueTemp,
    TrueAirspd,
    RecoveryFactor,
);
var computeMachFromCASAndPAlt = new ComputeMachFromCASAndPAlt(
    MACH,
    CalAirspd,
    PressAlt,
);
var computeTASFromTrueTempAndMach = new ComputeTASFromTrueTempAndMach(
    TrueAirspd,
    TrueTemp,
    MACH,
);
var computeCASFromPAltAndMach = new ComputeCASFromPAltAndMach(
    CalAirspd,
    PressAlt,
    MACH,
);
var computePressAltFromPressAlt = new ComputePressAltFromPressAlt(
    PressAlt,
    PressAlt,
);

// air speed - TAS, CAS - check for unit change in other airpseed input
var checkTASunits = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd,
    TrueAirspd,
    CalAirspd,
);
var checkCASunits = new ComputeSpeedFromSpeedCheckUnits(
    CalAirspd,
    CalAirspd,
    TrueAirspd,
);
// NOTE: add outputs only to equation screen (don't add recoveryFactor)
CONST.airspeedEqus = [
    computeTASFromTrueTempAndMach,
    computeTrueTempFromIndTempAndMach,
    computeMachFromTASAndTrueTemp,
    computeIndTempFromTrueTempAndMach,
    computeTrueTempFromIndTempAndTAS,
    computeIndTempFromTrueTempAndTAS,
    computeMachFromCASAndPAlt,
    computeCASFromPAltAndMach,
    computePressAltFromPressAlt,
    checkTASunits,
    checkCASunits,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Cloud base
var computeCloudBase = new ComputeCloudBaseFromAirTempandBarPress(
    CloudBase,
    TrueTemp,
    DewPoint,
);
var computeCBTemp = new ComputeTempFromCloudBaseandDewPoint(
    TrueTemp,
    CloudBase,
    DewPoint,
);
var computeDewPoint = new ComputeDewPointFromCloudBaseandTemp(
    DewPoint,
    CloudBase,
    TrueTemp,
);
CONST.cloudBaseEqus = [computeCloudBase, computeCBTemp, computeDewPoint];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Standard Atmosphere
/// the variables for these equations are not shared with the rest of
/// the calculator
var computeStdTempFromAltitude = new ComputeTempfromAltitude(
    StdAtmTemperature,
    StdAtmAltitude,
);
var computeStdPresFromAltitide = new ComputePressurefromAltitude(
    StdAtmPressure,
    StdAtmAltitude,
);
var computeStdAltitudeFromPressure = new ComputeAltitudefromPressure(
    StdAtmAltitude,
    StdAtmPressure,
);

CONST.stdAtmosphereEqus = [
    computeStdPresFromAltitide,
    computeStdTempFromAltitude,
    computeStdAltitudeFromPressure,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Fuel
var computeRateFromFuelandDur = new ComputeRateFromFuelAndDuration(
    FuelRate,
    FuelVol,
    Duration,
);
var computeAmountFromRateAndDuration = new ComputeAmountFromRateAndDuration(
    FuelVol,
    FuelRate,
    Duration,
);
var computeDurationFromAmountAndRate = new ComputeDurationFromAmountAndRate(
    Duration,
    FuelVol,
    FuelRate,
);
var computeVolumeFromWeightAndType = new ComputeVolumeFromWeightAndType(
    FuelVol,
    FuelWt,
    FuelType,
);
var computeWeightFromVolumeAndType = new ComputeWeightFromVolumeAndType(
    FuelWt,
    FuelVol,
    FuelType,
);
var computeWtRateFromWeightAndDuration = new ComputeWtRateFromWeightAndDuration(
    FuelWtRate,
    FuelWt,
    Duration,
);
var computeWeighttFromWtRateAndDuration =
    new ComputeWeighttFromWtRateAndDuration(FuelWt, FuelWtRate, Duration);
var computeDurationFromWeightAndWtRate = new ComputeDurationFromWeightAndWtRate(
    Duration,
    FuelWt,
    FuelWtRate,
);
var computeFuelType = new ComputeFuelType(FuelType, FuelType);

// NOTE: equations listed by order of output variable on screen (FuelVol only added once)
CONST.fuelEqus = [
    computeAmountFromRateAndDuration,
    computeVolumeFromWeightAndType,
    computeDurationFromAmountAndRate,
    computeRateFromFuelandDur,
    computeWeightFromVolumeAndType,
    computeWtRateFromWeightAndDuration,
    computeWeighttFromWtRateAndDuration,
    computeDurationFromWeightAndWtRate,
    computeFuelType,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Glide
var computeRatioFromDistanceAndDescent = new ComputeRatioFromDistanceAndDescent(
    GlideRatio,
    Distance,
    AltChange,
);
var computeDistanceFromRatioAndDescent = new ComputeDistanceFromRatioAndDescent(
    Distance,
    GlideRatio,
    AltChange,
);
var computeDescentFromDistanceAndRatio = new ComputeDescentFromDistanceAndRatio(
    AltChange,
    Distance,
    GlideRatio,
);

CONST.glideEqus = [
    computeDistanceFromRatioAndDescent,
    computeRatioFromDistanceAndDescent,
    computeDescentFromDistanceAndRatio,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Climb and Descent - new equations for unit changes
var computeDistanceFromDescAndAOC = new ComputeDistanceFromDescentAndClimbAngle(
    Distance,
    AltChange,
    AngleOfClimb,
);
var computeDescentFromDistAndAOC = new ComputeDescentFromDistanceAndClimbAngle(
    AltChange,
    Distance,
    AngleOfClimb,
);
var computeAOCFromDescAndDist = new ComputeClimbAngleFromDescentAndDistance(
    AngleOfClimb,
    AltChange,
    Distance,
);
var computeSpeedFromROCandAOC = new ComputeSpeedFromClimbRateAndAngle(
    GrndSpeed,
    RateOfClimb,
    AngleOfClimb,
);
var computeAOCFromROCAndSpeed = new ComputeClimbAngleFromClimbRateAndSpeed(
    AngleOfClimb,
    RateOfClimb,
    GrndSpeed,
);
var computeROCFromSpeedAndAOC = new ComputeClimbRateFromSpeedAndClimbAngle(
    RateOfClimb,
    GrndSpeed,
    AngleOfClimb,
);
var computeClimbRatioFromDistanceAndDescent =
    new ComputeClimbRatioFromDistanceAndDescent(GlideRatio, Distance, AltChange);

CONST.descentEqus = [
    computeDistanceFromDescAndAOC,
    computeDescentFromDistAndAOC,
    computeSpeedFromROCandAOC,
    computeROCFromSpeedAndAOC,
    computeAOCFromDescAndDist,
    computeClimbRatioFromDistanceAndDescent,
    computeAOCFromROCAndSpeed,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Compass Heading
var computeTrueHead = new ComputeTrueHeadFromMagVarAndMagDevAndCompHead(
    TrueHeading,
    VarEW,
    Deviation,
    CompHding,
);
var computeMagDev = new ComputeMagDevFromTrueHeadAndMagVarAndCompHead(
    Deviation,
    TrueHeading,
    VarEW,
    CompHding,
);
var computeMagVar = new ComputeMagVarFromTrueHeadAndMagDevAndCompHead(
    VarEW,
    TrueHeading,
    Deviation,
    CompHding,
);
var computeCompassHead = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding,
    TrueHeading,
    VarEW,
    Deviation,
);
var computeMagneticHead = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHeading,
    TrueHeading,
    VarEW,
);

CONST.compassHeadingEqus = [
    computeMagneticHead,
    computeCompassHead,
    computeTrueHead,
    computeMagDev,
    computeMagVar,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Wind Correction
var computeWindSpd = new ComputeWSFromGndSpdAndTASAndTCAndTH(
    WindSpeed,
    GrndSpeed,
    TrueAirspd,
    TrueCourse,
    TrueHeading,
);
var computeTAS = new ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC(
    TrueAirspd,
    GrndSpeed,
    WindSpeed,
    WindDir,
    TrueCourse,
);
var computeGndSpeed = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed,
    TrueAirspd,
    WindSpeed,
    WindDir,
    TrueHeading,
);
var computeTH = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading,
    TrueCourse,
    WindDir,
    WindSpeed,
    TrueAirspd,
);
var computeTC = new ComputeTCFromTHAndWndDirAndWndSpeedAndGS(
    TrueCourse,
    TrueHeading,
    WindDir,
    WindSpeed,
    GrndSpeed,
);
var computeWindDir = new ComputeWDirFromTCAndTASAndTHAndGndSpd(
    WindDir,
    TrueCourse,
    TrueAirspd,
    TrueHeading,
    GrndSpeed,
);
var computeWCA = new ComputeWCAFromTHAndTC(WCA, TrueHeading, TrueCourse);

CONST.windCorrectionEqus = [
    computeWindSpd,
    computeTAS,
    computeGndSpeed,
    computeTH,
    computeTC,
    computeWindDir,
    computeWCA,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Wind Component
var computeCrossWind = new ComputeXWindFromWndSpdAndWindDirAndRunWay(
    CrossWind,
    WindSpeed,
    WindDir,
    Runway,
);
var computeHeadWind = new ComputeHWindFromWndSpdAndWindDirAndRunWay(
    HeadWind,
    WindSpeed,
    WindDir,
    Runway,
);
var computeWindSpeed = new ComputeSpeedFromSpeedCheckHwindXwind(
    WindSpeed,
    WindSpeed,
    HeadWind,
    CrossWind,
);

CONST.windComponentEqus = [computeCrossWind, computeHeadWind, computeWindSpeed];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Estimated Time of Arrival
var computeETA = new ComputeETAfromTimeAndStart(ETA, Duration, LegStart);
var computeStart = new ComputeStartfromDurAndETA(LegStart, Duration, ETA);
var computeDuration = new ComputeDurfromETAAndStart(Duration, LegStart, ETA);

CONST.estTimeArrivalEqus = [computeETA, computeStart, computeDuration];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// To/From
var computeToCourse = new ComputeOppositeCourse(To, From);
var computeFromCourse = new ComputeOppositeCourse(From, To);

CONST.toFromEqus = [computeToCourse, computeFromCourse];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Holding Pattern
var computeRightTurn = new ComputeTurnDirection(TurnDir, TurnDir);
var computeHeading = new ComputeHeadingfromHeading(
    HoldPatHeading,
    HoldPatHeading,
);
var computeHoldRadical = new ComputeOppositeCourse(
    HoldingRadical,
    InboundHeading,
);
var computeInboundHeading = new ComputeOppositeCourse(
    InboundHeading,
    HoldingRadical,
);
var computeEntryType = new ComputeEntryPattern(
    EntryType,
    TurnDir,
    HoldPatHeading,
    HoldingRadical,
);

CONST.holdingPatternEqus = [
    computeRightTurn,
    computeHeading,
    computeHoldRadical,
    computeEntryType,
    computeInboundHeading,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Unit Conversion
var computeDistanceCU = new ComputeDistanceFromDistance(
    DistanceAll,
    DistanceAll,
);
var computeSpeedCU = new ComputeSpeedFromSpeedGS(Speed, Speed);
var computeDurationCU = new ComputeDurationFromDuration(DurationCU, DurationCU);
var computeTemp = new ComputeTempFromTemp(Temperature, Temperature);
var computePressure = new ComputePressureFromPressure(Pressure, Pressure);
var computeVolume = new ComputeVolumeFromVolume(Volume, Volume);
var computeRate = new ComputeRateFromRate(Rate, Rate);
var computeWeight = new ComputeWeightFromWeight(Weight, Weight);
var computeRoC = new ComputeROCfromROC(ClimbRate, ClimbRate);
var computeAoC = new ComputeAOCfromAOC(ClimbAngle, ClimbAngle);
var computeTorque = new ComputeTorqueFromTorque(Torque, Torque);
var computeAngle = new ComputePointAFromPointA(Angle, Angle);

CONST.convertUnitEqus = [
    computeDistanceCU,
    computeSpeedCU,
    computeDurationCU,
    computeTemp,
    computePressure,
    computeVolume,
    computeRate,
    computeWeight,
    computeRoC,
    computeAoC,
    computeTorque,
    computeAngle,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Settings - set clock time
var computeUTC = new ComputeUTCfromLOCorDES(TimeUTC, TimeLocal, TimeDest);
var computeLOC = new ComputeLOCfromUTCorDES(TimeLocal, TimeUTC, TimeDest);
var computeDES = new ComputeDESfromLOCorUTC(TimeDest, TimeLocal, TimeUTC);

CONST.clockSetEqus = [computeUTC, computeLOC, computeDES];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Set Default Units
var setUnitSpeed = new ComputeSpeedFromSpeedGS(GSpeed, GSpeed);
var setUnitAirSpeed = new ComputeSpeedFromSpeed(ASpeed, ASpeed);
var setUnitDistance = new ComputeDistanceFromDistance(DistSetUnit, DistSetUnit);
var setUnitLength = new ComputeLengthFromLength(Length, Length);
var setUnitAtltitude = new ComputePressAltFromPressAlt(Altitude, Altitude);
var setUnitDuration = new ComputeDurationFromDuration(DurationCU, DurationCU);
var setUnitTemp = new ComputeTempFromTemp(TempSetDefault, TempSetDefault);
var setUnitPressure = new ComputePressureFromPressure(Pressure, Pressure);
var setUnitVolume = new ComputeVolumeFromVolume(Volume, Volume);
var setUnitRate = new ComputeRateFromRate(Rate, Rate);
var setUnitWeight = new ComputeWeightFromWeight(Weight, Weight);
var setUnitRoC = new ComputeROCfromROC(ClimbRate, ClimbRate);
var setUnitAoC = new ComputeAOCfromAOC(ClimbAngle, ClimbAngle);
var setUnitTorque = new ComputeTorqueFromTorque(Torque, Torque);
var setUnitAngle = new ComputePointAFromPointA(Angle, Angle);

CONST.setDefaultUnitEqus = [
    setUnitSpeed,
    setUnitAirSpeed,
    setUnitDistance,
    setUnitAtltitude,
    setUnitLength,
    setUnitDuration,
    setUnitTemp,
    setUnitPressure,
    setUnitRate,
    setUnitVolume,
    setUnitRoC,
    setUnitAoC,
    setUnitWeight,
    setUnitTorque,
    setUnitAngle,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Rhumb Line
var computeLatA = new ComputeAngleFromAngleCheckUnits(
    LatitudeA,
    LatitudeA,
    LongitudeA,
    LatitudeD,
);
var computeLongA = new ComputeAngleFromAngleCheckUnits(
    LongitudeA,
    LongitudeA,
    LatitudeA,
    LongitudeD,
);

var computeTCrABfromPosAB = new ComputeTrueCourseFromPositionCoordinates(
    TrueCourseAB,
    LatitudeA,
    LongitudeA,
    LatitudeB,
    LongitudeB,
);
var computeDistABfromPosAB = new ComputeDistanceFromPositionCoordinates(
    DistanceAB,
    LatitudeA,
    LongitudeA,
    LatitudeB,
    LongitudeB,
);

var computeLonBfromTCrABandDistA = new ComputeLonFromTrueCourseAndDistance(
    LongitudeB,
    LatitudeA,
    LongitudeA,
    TrueCourseAB,
    DistanceAB,
);
var computeLatBfromTCrABandDistA = new ComputeLatFromTrueCourseAndDistance(
    LatitudeB,
    LatitudeA,
    LongitudeA,
    TrueCourseAB,
    DistanceAB,
);

var computeTCrBCfromPosBC = new ComputeTrueCourseFromPositionCoordinates(
    TrueCourseBC,
    LatitudeB,
    LongitudeB,
    LatitudeC,
    LongitudeC,
);
var computeDistBCfromPosBC = new ComputeDistanceFromPositionCoordinates(
    DistanceBC,
    LatitudeB,
    LongitudeB,
    LatitudeC,
    LongitudeC,
);

var computeLonCfromTCrBCandDistB = new ComputeLonFromTrueCourseAndDistance(
    LongitudeC,
    LatitudeB,
    LongitudeB,
    TrueCourseBC,
    DistanceBC,
);
var computeLatCfromTCrBCandDistB = new ComputeLatFromTrueCourseAndDistance(
    LatitudeC,
    LatitudeB,
    LongitudeB,
    TrueCourseBC,
    DistanceBC,
);

var computeTCrCDfromPosCD = new ComputeTrueCourseFromPositionCoordinates(
    TrueCourseCD,
    LatitudeC,
    LongitudeC,
    LatitudeD,
    LongitudeD,
);
var computeDistCDfromPosCD = new ComputeDistanceFromPositionCoordinates(
    DistanceCD,
    LatitudeC,
    LongitudeC,
    LatitudeD,
    LongitudeD,
);

var computeLonDfromTCrCDandDistC = new ComputeLonFromTrueCourseAndDistance(
    LongitudeD,
    LatitudeC,
    LongitudeC,
    TrueCourseCD,
    DistanceCD,
);
var computeLatDfromTCrCDandDistC = new ComputeLatFromTrueCourseAndDistance(
    LatitudeD,
    LatitudeC,
    LongitudeC,
    TrueCourseCD,
    DistanceCD,
);
var computePointA = new ComputeItemFromItemNoText(PointA, PointA);
var computePointB = new ComputeItemFromItemNoText(PointB, PointB);
var computeRhumbLineAB = new ComputeItemFromItemNoText(
    RhumbLineAB,
    RhumbLineAB,
);
var computePointC = new ComputeItemFromItem(PointC, PointC);
var computePointD = new ComputeItemFromItem(PointD, PointD);
var computeRhumbLineBC = new ComputeItemFromItem(RhumbLineBC, RhumbLineBC);
var computeRhumbLineCD = new ComputeItemFromItem(RhumbLineCD, RhumbLineCD);
//equations for distance default unit change
var checkDistABunit = new ComputeDistanceFromDistanceCheckUnits(
    DistanceAB,
    DistanceAB,
    DistanceBC,
);
var checkDistBCunit = new ComputeDistanceFromDistanceCheckUnits(
    DistanceBC,
    DistanceBC,
    DistanceCD,
);
var checkDistCDunit = new ComputeDistanceFromDistanceCheckUnits(
    DistanceCD,
    DistanceCD,
    DistanceAB,
);

CONST.rhumbLineEqus = [
    computePointA,
    computeLatA,
    computeLongA,

    computeRhumbLineAB,
    computeTCrABfromPosAB,
    computeDistABfromPosAB,

    computePointB,
    computeLatBfromTCrABandDistA,
    computeLonBfromTCrABandDistA,

    computeRhumbLineBC,
    computeTCrBCfromPosBC,
    computeDistBCfromPosBC,

    computePointC,
    computeLatCfromTCrBCandDistB,
    computeLonCfromTCrBCandDistB,

    computeRhumbLineCD,
    computeTCrCDfromPosCD,
    computeDistCDfromPosCD,

    computePointD,
    computeLatDfromTCrCDandDistC,
    computeLonDfromTCrCDandDistC,

    checkDistABunit,
    checkDistBCunit,
    checkDistCDunit,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Weight & Balance
/// Items 1 to 4
var computeItem1Weight = new ComputeItemWeightFromMOMandARM(
    WeightA,
    ReductionFactor,
    MomA,
    ArmA,
);
var computeItem1MOM = new ComputeItemMOMFromWeightAndARM(
    MomA,
    ReductionFactor,
    WeightA,
    ArmA,
);
var computeItem1Arm = new ComputeItemArmFromMOMandWeight(
    ArmA,
    ReductionFactor,
    MomA,
    WeightA,
);

var computeItem2Weight = new ComputeItemWeightFromMOMandARM(
    WeightB,
    ReductionFactor,
    MomB,
    ArmB,
);
var computeItem2MOM = new ComputeItemMOMFromWeightAndARM(
    MomB,
    ReductionFactor,
    WeightB,
    ArmB,
);
var computeItem2Arm = new ComputeItemArmFromMOMandWeight(
    ArmB,
    ReductionFactor,
    MomB,
    WeightB,
);

var computeItem3Weight = new ComputeItemWeightFromMOMandARM(
    WeightC,
    ReductionFactor,
    MomC,
    ArmC,
);
var computeItem3MOM = new ComputeItemMOMFromWeightAndARM(
    MomC,
    ReductionFactor,
    WeightC,
    ArmC,
);
var computeItem3Arm = new ComputeItemArmFromMOMandWeight(
    ArmC,
    ReductionFactor,
    MomC,
    WeightC,
);

var computeItem4Weight = new ComputeItemWeightFromMOMandARM(
    WeightD,
    ReductionFactor,
    MomD,
    ArmD,
);
var computeItem4MOM = new ComputeItemMOMFromWeightAndARM(
    MomD,
    ReductionFactor,
    WeightD,
    ArmD,
);
var computeItem4Arm = new ComputeItemArmFromMOMandWeight(
    ArmD,
    ReductionFactor,
    MomD,
    WeightD,
);

var computeTotalWeight1to4 = new ComputeTotalWeightItems1to4(
    TotalWeightA,
    WeightA,
    WeightB,
    WeightC,
    WeightD,
);
var computeTotalMOM1to4 = new ComputeTotalMomentItems1to4(
    TotalMomA,
    MomA,
    MomB,
    MomC,
    MomD,
);
/// Items 5 to 8
var computeItem5Weight = new ComputeItemWeightFromMOMandARM(
    Weight5,
    ReductionFactor,
    Mom5,
    Arm5,
);
var computeItem5MOM = new ComputeItemMOMFromWeightAndARM(
    Mom5,
    ReductionFactor,
    Weight5,
    Arm5,
);
var computeItem5Arm = new ComputeItemArmFromMOMandWeight(
    Arm5,
    ReductionFactor,
    Mom5,
    Weight5,
);

var computeItem6Weight = new ComputeItemWeightFromMOMandARM(
    Weight6,
    ReductionFactor,
    Mom6,
    Arm6,
);
var computeItem6MOM = new ComputeItemMOMFromWeightAndARM(
    Mom6,
    ReductionFactor,
    Weight6,
    Arm6,
);
var computeItem6Arm = new ComputeItemArmFromMOMandWeight(
    Arm6,
    ReductionFactor,
    Mom6,
    Weight6,
);

var computeItem7Weight = new ComputeItemWeightFromMOMandARM(
    Weight7,
    ReductionFactor,
    Mom7,
    Arm7,
);
var computeItem7MOM = new ComputeItemMOMFromWeightAndARM(
    Mom7,
    ReductionFactor,
    Weight7,
    Arm7,
);
var computeItem7Arm = new ComputeItemArmFromMOMandWeight(
    Arm7,
    ReductionFactor,
    Mom7,
    Weight7,
);

var computeItem8Weight = new ComputeItemWeightFromMOMandARM(
    Weight8,
    ReductionFactor,
    Mom8,
    Arm8,
);
var computeItem8MOM = new ComputeItemMOMFromWeightAndARM(
    Mom8,
    ReductionFactor,
    Weight8,
    Arm8,
);
var computeItem8Arm = new ComputeItemArmFromMOMandWeight(
    Arm8,
    ReductionFactor,
    Mom8,
    Weight8,
);

var computeTotalWeight5to8 = new ComputeTotalWeightItems5to8(
    TotalWeightB,
    Weight5,
    Weight6,
    Weight7,
    Weight8,
);
var computeTotalMOM5to8 = new ComputeTotalMomentItems5to8(
    TotalMomB,
    Mom5,
    Mom6,
    Mom7,
    Mom8,
);
// Totals (up to 8 items)
var computeTotalWeight = new ComputeTotalWeightUpTo8items(
    TotalWeight,
    TotalWeightA,
    TotalWeightB,
);
var computeTotalMOM = new ComputeTotalMomentUpTo8Items(
    TotalMom,
    TotalMomA,
    TotalMomB,
);
var computeCenterOfGravity = new ComputeItemArmFromMOMandWeight(
    CG,
    ReductionFactor,
    TotalMom,
    TotalWeight,
);
// dummy equations - check for simiar unit change for total weight and moment (CG checked by equation above
var checklWeightUnits = new ComputeWeightFromWeightCheckLength(
    TotalWeight,
    TotalWeight,
    CG,
);
var checklMomentUnits = new ComputeMomentFromMomentCheckLength(
    TotalMom,
    TotalMom,
    CG,
);

CONST.weightbalanceEqus = [
    computeItem1Weight,
    computeItem1Arm,
    computeItem1MOM,
    computeItem2Weight,
    computeItem2Arm,
    computeItem2MOM,
    computeItem3Weight,
    computeItem3Arm,
    computeItem3MOM,
    computeItem4Weight,
    computeItem4Arm,
    computeItem4MOM,
    computeItem5Weight,
    computeItem5Arm,
    computeItem5MOM,
    computeItem6Weight,
    computeItem6Arm,
    computeItem6MOM,
    computeItem7Weight,
    computeItem7Arm,
    computeItem7MOM,
    computeItem8Weight,
    computeItem8Arm,
    computeItem8MOM,
    computeTotalWeight, // totals
    computeTotalMOM,
    computeCenterOfGravity,
    computeTotalWeight1to4, // intermediate calculattions - set preferred units ONLY
    computeTotalMOM1to4,
    computeTotalWeight5to8,
    computeTotalMOM5to8,
    checklWeightUnits, // dummy to check for unit changes - set preferred units ONLY
    checklMomentUnits,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Aircraft Profile Weight & Balance Equations
// Aircraft Profile Inputs ///////////////////////////////////////////////////////////
// Check for valid items (wt & bal profile, empty aircraft, fuel, individual item arms)
var checkForValidProfile = new CheckForItemValidThreeInputs(
    AircraftWtBal,
    AircraftEmpty,
    AircraftFuel,
    AircraftItems,
);
var checkForValidEmptyAircraft = new CheckForItemValidFourInputs(
    AircraftEmpty,
    AircraftRF,
    AircraftWeight,
    AircraftArm,
    AircraftMom,
);
var checkForValidFuel = new CheckForItemValidTwoInputs(
    AircraftFuel,
    FuelArm,
    AircraftFuelType,
);
var checkForValidItemArms = new CheckForItemValidFourInputs(
    AircraftItems,
    PilotArm,
    FrontPsgrArm,
    RearPsgrArm,
    AircraftCargo,
);
var checkForValidCargo = new CheckForItemValidTwoInputs(
    AircraftCargo,
    Cargo1Arm,
    Cargo2Arm,
);
// Empty Aircraft - Use weight and balance wt/arm/mom item equations
var computeAircraftWeight = new ComputeItemWeightFromMOMandARM(
    AircraftWeight,
    AircraftRF,
    AircraftMom,
    AircraftArm,
);
var computeAircraftMOM = new ComputeItemMOMFromWeightAndARM(
    AircraftMom,
    AircraftRF,
    AircraftWeight,
    AircraftArm,
);
var computeAircraftArm = new ComputeItemArmFromMOMandWeight(
    AircraftArm,
    AircraftRF,
    AircraftMom,
    AircraftWeight,
);
// populate AircraftEmpty Item, then RF variable, then outputs to equation below
CONST.emptyAircraftEqus = [
    computeAircraftWeight,
    computeAircraftArm,
    computeAircraftMOM,
];
// Aircraft Fuel - Use dummy equations to allow for unit changes
var setAircraftFuelType = new ComputeFuelType(
    AircraftFuelType,
    AircraftFuelType,
);
var setAircraftFuelArm = new ComputeLengthFromLength(FuelArm, FuelArm);
var setAircraftFuelAux = new ComputeLengthFromLength(FuelAux, FuelAux);
// populate AircraftFuel Item, then outputs to equation below
CONST.aircraftFuelEqus = [
    setAircraftFuelType,
    setAircraftFuelArm,
    setAircraftFuelAux,
];
// Aircraft Item Arms - Use dummy equations to allow for unit changes
var setPilotArm = new ComputeLengthFromLength(PilotArm, PilotArm);
var setFrontPsgrArm = new ComputeLengthFromLength(FrontPsgrArm, FrontPsgrArm);
var setRearPsgrArm = new ComputeLengthFromLength(RearPsgrArm, RearPsgrArm);
var setCargo1Arm = new ComputeLengthFromLength(Cargo1Arm, Cargo1Arm);
var setCargo2Arm = new ComputeLengthFromLength(Cargo2Arm, Cargo2Arm);
var setCustom1Arm = new ComputeLengthFromLength(Custom1Arm, Custom1Arm);
var setCustom2Arm = new ComputeLengthFromLength(Custom2Arm, Custom2Arm);
var setCustom3Arm = new ComputeLengthFromLength(Custom3Arm, Custom3Arm);
// populate AircraftItems Item, then outputs to equation below
CONST.aircraftItemArmEqus = [
    setPilotArm,
    setFrontPsgrArm,
    setRearPsgrArm,
    setCargo1Arm,
    setCargo2Arm,
    setCustom1Arm,
    setCustom2Arm,
    setCustom3Arm,
];

// full aircraft equations: used to store output variable value and prefered unit in NV memory
CONST.aircraftEqus = [
    computeAircraftWeight,
    computeAircraftArm,
    computeAircraftMOM,
    setAircraftFuelType,
    setAircraftFuelArm,
    setAircraftFuelAux,
    setPilotArm,
    setFrontPsgrArm,
    setRearPsgrArm,
    setCargo1Arm,
    setCargo2Arm,
    setCustom1Arm,
    setCustom2Arm,
    setCustom3Arm,
];

// Intermediate equations - no variables transfered to either screen ////////////////////////
// Fuel Weight
var computeAircraftFuelWeight = new ComputeWeightFromVolumeAndType(
    AircraftFuelWt,
    AircraftFuelVol,
    AircraftFuelType,
);
// Item Arms
var computeFuelMOM = new ComputeItemMOMFromWeightAndARM(
    FuelMom,
    AircraftRF,
    AircraftFuelWt,
    FuelArm,
);
var computePilotMOM = new ComputeItemMOMFromWeightAndARM(
    PilotMom,
    AircraftRF,
    PilotWeight,
    PilotArm,
);
var computeFrontPsgrMOM = new ComputeItemMOMFromWeightAndARM(
    FrontPsgrMom,
    AircraftRF,
    FrontPsgrWeight,
    FrontPsgrArm,
);
var computeRearPsgrMOM = new ComputeItemMOMFromWeightAndARM(
    RearPsgrMom,
    AircraftRF,
    RearPsgrWeight,
    RearPsgrArm,
);
var computeCargo1MOM = new ComputeItemMOMFromWeightAndARM(
    Cargo1Mom,
    AircraftRF,
    Cargo1Weight,
    Cargo1Arm,
);
var computeCargo2MOM = new ComputeItemMOMFromWeightAndARM(
    Cargo2Mom,
    AircraftRF,
    Cargo2Weight,
    Cargo2Arm,
);
var computeCustom1MOM = new ComputeItemMOMFromWeightAndARM(
    Custom1Mom,
    AircraftRF,
    Custom1Weight,
    Custom1Arm,
);
var computeCustom2MOM = new ComputeItemMOMFromWeightAndARM(
    Custom2Mom,
    AircraftRF,
    Custom2Weight,
    Custom2Arm,
);
var computeCustom3MOM = new ComputeItemMOMFromWeightAndARM(
    Custom3Mom,
    AircraftRF,
    Custom3Weight,
    Custom3Arm,
);
// Partial weight & moment
var computeAircraftWeightA = new ComputeProfileTotalWeight4Items(
    AircraftWeightA,
    AircraftWeight,
    AircraftFuelWt,
    PilotWeight,
    FrontPsgrWeight,
);
/*var computeAircrafMomA = new ComputeProfileTotalMoment4Items(
  AircraftTotalMomA,
  AircraftMom,
  FuelMom,
  PilotMom,
  FrontPsgrMom,
);*/

// Weight & Balance (with Aircraft Profile) Inputs ///////////////////////////////////////////////////////////
// dummy equations to catch unit change & and check for unit change from corresponding profile setup input
// Fuel Volume - check fuel Arm (length)
var computeAircraftFuelVolume = new ComputeVolumeFromVolumeCheckLength(
    AircraftFuelVol,
    AircraftFuelVol,
    FuelArm,
    FuelAux,
);

// Item Weight - check item Arm (length)
var checkAircraftPilotUnits = new ComputeWeightFromWeightCheckLength(
    PilotWeight,
    PilotWeight,
    PilotArm,
);
var checkAircraftFrontPsgrUnits = new ComputeWeightFromWeightCheckLength(
    FrontPsgrWeight,
    FrontPsgrWeight,
    FrontPsgrArm,
);
var checkAircraftRearPsgrUnits = new ComputeWeightFromWeightCheckLength(
    RearPsgrWeight,
    RearPsgrWeight,
    RearPsgrArm,
);
var checkAircraftCargo1Units = new ComputeWeightFromWeightCheckLength(
    Cargo1Weight,
    Cargo1Weight,
    Cargo1Arm,
);
var checkAircraftCargo2Units = new ComputeWeightFromWeightCheckLength(
    Cargo2Weight,
    Cargo2Weight,
    Cargo2Arm,
);

var checkAircraftCustom1Units = new ComputeWeightFromWeightCheckLength(
    Custom1Weight,
    Custom1Weight,
    Custom1Arm,
);

var checkAircraftCustom2Units = new ComputeWeightFromWeightCheckLength(
    Custom2Weight,
    Custom2Weight,
    Custom2Arm,
);
var checkAircraftCustom3Units = new ComputeWeightFromWeightCheckLength(
    Custom3Weight,
    Custom3Weight,
    Custom3Arm,
);

// Output Equations - Add 'totals' item and AircraftRF then outputs (indent RF out outputs) /////
// Totals (empty aircraft, fuel, up to 5 items)

var computeAircraftWeightTotal = new ComputeProfileTotalWeight(
    AircraftTotalWeight,
    AircraftWeight,
    AircraftFuelWt,
    PilotWeight,
    FrontPsgrWeight,
    RearPsgrWeight,
    Cargo1Weight,
    Cargo2Weight,
    Custom1Weight,
    Custom2Weight,
    Custom3Weight,
);

var computeAircraftMomTotal = new ComputeProfileTotalMoment(
    AircraftTotalMom,
    AircraftMom,
    FuelMom,
    PilotMom,
    RearPsgrMom,
    FrontPsgrMom,
    Cargo1Mom,
    Cargo2Mom,
    Custom1Mom,
    Custom2Mom,
    Custom3Mom,
);
var computeAircraftCG = new ComputeItemArmFromMOMandWeight(
    AircraftCG,
    AircraftRF,
    AircraftTotalMomA,
    AircraftTotalWeight,
);
// dummy equations - check for simiar unit change for total weight and moment (CG checked by equation above
var checkProfileWeightUnits = AircraftTotalWeight;
/*new ComputeWeightFromWeightCheckLength(
  AircraftTotalWeight,
  AircraftTotalWeight,
  AircraftCG,
);*/
var checkProfileMomUnits = new ComputeProfileTotalMoment(
    AircraftTotalMomA,
    AircraftMom,
    FuelMom,
    PilotMom,
    RearPsgrMom,
    FrontPsgrMom,
    Cargo1Mom,
    Cargo2Mom,
    Custom1Mom,
    Custom2Mom,
    Custom3Mom,
);
/*= new ComputeMomentFromMomentCheckLength(
  AircraftTotalMom,
  AircraftTotalMom,
  AircraftCG,
);*/

CONST.aircraftWeightBalanceEqus = [
    computeAircraftFuelVolume,
    checkAircraftPilotUnits,
    checkAircraftFrontPsgrUnits,
    checkAircraftRearPsgrUnits,
    checkAircraftCargo1Units,
    checkAircraftCargo2Units,
    checkAircraftCustom1Units,
    checkAircraftCustom2Units,
    checkAircraftCustom3Units,
    computeAircraftWeightTotal, // totals

    computeAircraftMomTotal,
    //computeAircraftWeightA, // intermediate calculations - set preferred units ONLY (no variable to add to screen)
    computeAircraftWeightTotal, // dummy to check for unit changes - set active & preferred units ONLY
    computeAircraftCG,
    //computeAircrafMomA,

    checkProfileMomUnits,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Weight & Shift Equations
var computeChangeInArm = new ComputeChangeInArm(
    ChangeArm,
    ShiftItemWeight,
    ShiftTotalWeight,
    ChangeCG,
);
var computeChangeInCG = new ComputeChangeInCG(
    ChangeCG,
    ShiftItemWeight,
    ShiftTotalWeight,
    ChangeArm,
);
var computeChangeInItemWt = new ComputeChangeInItemWt(
    ShiftItemWeight,
    ChangeArm,
    ShiftTotalWeight,
    ChangeCG,
);

var computeChangeInTotalWt = new ComputeChangeInTotalWt(
    ShiftTotalWeight,
    ShiftItemWeight,
    ChangeArm,
    ChangeCG,
);

CONST.weightShiftEqus = [
    computeChangeInArm,
    computeChangeInCG,
    computeChangeInItemWt,
    computeChangeInTotalWt,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Percent MAC Equations
var computePercentMAC = new ComputePercentMAC(PercentMAC, MAC, MacCG, LEMAC);
var computeMAC = new ComputeMAC(MAC, PercentMAC, MacCG, LEMAC);
var computeMacCG = new ComputeMacCG(MacCG, PercentMAC, MAC, LEMAC);
var computeLMAC = new ComputeLMAC(LEMAC, PercentMAC, MAC, MacCG);

CONST.percentMacEqus = [
    computePercentMAC,
    computeMAC,
    computeMacCG,
    computeLMAC,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - Totals (up to 5 legs)
var computeTotalDistanceLegs1to5 = new ComputeTotalDistanceLegs1to5(
    DistanceTotal,
    Distance1,
    Distance2,
    Distance3,
    Distance4,
    Distance5,
);
var computeTotalDurationLegs1to5 = new ComputeTotalDurationLegs1to5(
    LegTimeTotal,
    LegTime1,
    LegTime2,
    LegTime3,
    LegTime4,
    LegTime5,
);
var computeTotalETALegs1to5 = new ComputeTotalETALegs1to5(
    ETAtotal,
    ETA1,
    ETA2,
    ETA3,
    ETA4,
    ETA5,
);
var computeTotalFuelLegs1to5 = new ComputeTotalFuelLegs1to5(
    FuelVolTotal,
    FuelVol1,
    FuelVol2,
    FuelVol3,
    FuelVol4,
    FuelVol5,
);

CONST.tripPlanTotalEqus = [
    computeTotalDistanceLegs1to5,
    computeTotalDurationLegs1to5,
    computeTotalETALegs1to5,
    computeTotalFuelLegs1to5,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - 1st Leg
/// TODO: should there be one single set of trip leg equations? (copy trip leg variables to/from trip leg equation variables)
// Wind Correction -Ground Speed, True Heading, Wind Correction Angle
var computeGndSpeedLeg1 = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed1,
    TrueAirspd1,
    WindSpeed1,
    WindDir1,
    TrueHeading1,
);
var computeTHleg1 = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading1,
    TrueCourse1,
    WindDir1,
    WindSpeed1,
    TrueAirspd1,
);
var computeWCAleg1 = new ComputeWCAFromTHAndTC(WCA1, TrueHeading1, TrueCourse1);

// Compass Heading - Compass Heading, Magnetic Heading
var computeCompassHeadLeg1 = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding1,
    TrueHeading1,
    VarEW1,
    Deviation1,
);
var computeMagneticHeadLeg1 = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHding1,
    TrueHeading1,
    VarEW1,
);

//Duration (ETE) & ETA
var computeTimeLeg1 = new ComputeTimeHMSFromDistanceAndSpeed(
    LegTime1,
    Distance1,
    GrndSpeed1,
);
var computeETAleg1 = new ComputeETAfromTimeAndStart(ETA1, LegTime1, LegStart1);

// Fuel - Fuel Amout
var computeFuelLeg1 = new ComputeAmountUSGalFromRateAndDuration(
    FuelVol1,
    FuelRate1,
    LegTime1,
);

// Dummy equations - set preferred units (& catch unit changes?)
// angle - TC, WDir, Var, Dev
var computeTCleg1 = new ComputeAngleFromAngle(TrueCourse1, TrueCourse1);
var computeWDirLeg1 = new ComputeAngleFromAngle(WindDir1, WindDir1);
var computeVarLeg1 = new ComputeAngle180FromAngle(VarEW1, VarEW1);
var computeDevLeg1 = new ComputeAngle180FromAngle(Deviation1, Deviation1);
// distance - Dist
var computeDistleg1 = new ComputeDistanceFromDistCheckSpeed(
    Distance1,
    Distance1,
    GrndSpeed1,
);

// ground speed - check dist units
var checkGndSpeedLeg1 = new ComputeGroundSpeedFromSpeedCheckUnits(
    GrndSpeed1,
    GrndSpeed1,
    Distance1,
);

// air speed - TAS, WSpd - and check for unit change in other airpseed input
var computeTASLeg1 = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd1,
    TrueAirspd1,
    WindSpeed1,
);
var computeWSpdLeg1 = new ComputeSpeedFromSpeedCheckUnits(
    WindSpeed1,
    WindSpeed1,
    TrueAirspd1,
);
// rate - FuelRate
var computeFuelRateleg1 = new ComputeRateFromRateCheckVol(
    FuelRate1,
    FuelRate1,
    FuelVol1,
);
// duration - Depart
// TODO: change to unit 'time' and set timezone (always HMS format)
var computeStartleg1 = new ComputeTimeFromTime(LegStart1, LegStart1);

CONST.tripPlanLeg1Equs = [
    computeDistleg1,
    computeTCleg1,
    computeTASLeg1,
    computeWDirLeg1,
    computeWSpdLeg1,
    computeVarLeg1,
    computeDevLeg1,
    computeFuelRateleg1,
    computeStartleg1,
    checkGndSpeedLeg1, //unit check only - don't add 2 GS variables (required to set equation active)
    computeGndSpeedLeg1,
    computeCompassHeadLeg1,
    computeMagneticHeadLeg1,
    computeTHleg1,
    computeWCAleg1,
    computeFuelLeg1,
    computeTimeLeg1,
    computeETAleg1,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - 2nd Leg
// Wind Correction -Ground Speed, True Heading, Wind Correction Angle
var computeGndSpeedLeg2 = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed2,
    TrueAirspd2,
    WindSpeed2,
    WindDir2,
    TrueHeading2,
);
var computeTHleg2 = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading2,
    TrueCourse2,
    WindDir2,
    WindSpeed2,
    TrueAirspd2,
);
var computeWCAleg2 = new ComputeWCAFromTHAndTC(WCA2, TrueHeading2, TrueCourse2);

// Compass Heading - Compass Heading, Magnetic Heading (NEW!)
var computeCompassHeadLeg2 = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding2,
    TrueHeading2,
    VarEW2,
    Deviation2,
);
var computeMagneticHeadLeg2 = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHding2,
    TrueHeading2,
    VarEW2,
);

// Ground Speed - Duration (ETE) & ETA (NEW!)
var computeTimeLeg2 = new ComputeTimeHMSFromDistanceAndSpeed(
    LegTime2,
    Distance2,
    GrndSpeed2,
);
var computeETAleg2 = new ComputeETAfromTimeAndStart(ETA2, LegTime2, LegStart2);

// Fuel - Fuel Amout
var computeFuelLeg2 = new ComputeAmountUSGalFromRateAndDuration(
    FuelVol2,
    FuelRate2,
    LegTime2,
);

// Dummy equations - set preferred units (& catch unit changes?)
// angle - TC, WDir, Var, Dev
var computeTCleg2 = new ComputeAngleFromAngle(TrueCourse2, TrueCourse2);
var computeWDirLeg2 = new ComputeAngleFromAngle(WindDir2, WindDir2);
var computeVarLeg2 = new ComputeAngle180FromAngle(VarEW2, VarEW2);
var computeDevLeg2 = new ComputeAngle180FromAngle(Deviation2, Deviation2);
// distance - Dist
//ComputeDistanceFromDistance          computeDistleg2(Distance2,
//                          Distance2);
// distance - Dist
var computeDistleg2 = new ComputeDistanceFromDistCheckSpeed(
    Distance2,
    Distance2,
    GrndSpeed2,
);

// air speed - TAS, WSpd - and check for unit change in other airpseed input
var computeTASLeg2 = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd2,
    TrueAirspd2,
    WindSpeed2,
);
var computeWSpdLeg2 = new ComputeSpeedFromSpeedCheckUnits(
    WindSpeed2,
    WindSpeed2,
    TrueAirspd2,
);
// ground speed - check dist units
var checkGndSpeedLeg2 = new ComputeGroundSpeedFromSpeedCheckUnits(
    GrndSpeed2,
    GrndSpeed2,
    Distance2,
);

// rate - FuelRate
var computeFuelRateleg2 = new ComputeRateFromRateCheckVol(
    FuelRate2,
    FuelRate2,
    FuelVol2,
);
// duration - Depart
// TODO: change to unit 'time' and set timezone (always HMS format)
var computeStartleg2 = new ComputeTimeFromTime(LegStart2, LegStart2);

CONST.tripPlanLeg2Equs = [
    computeDistleg2,
    computeTCleg2,
    computeTASLeg2,
    computeWDirLeg2,
    computeWSpdLeg2,
    computeVarLeg2,
    computeDevLeg2,
    computeFuelRateleg2,
    computeStartleg2,
    checkGndSpeedLeg2, //unit check only - don't add 2 GS variables (required to set equation active)
    computeGndSpeedLeg2,
    computeCompassHeadLeg2,
    computeMagneticHeadLeg2,
    computeTHleg2,
    computeWCAleg2,
    computeFuelLeg2,
    computeTimeLeg2,
    computeETAleg2,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - 3rd Leg
// Wind Correction -Ground Speed, True Heading, Wind Correction Angle
var computeGndSpeedLeg3 = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed3,
    TrueAirspd3,
    WindSpeed3,
    WindDir3,
    TrueHeading3,
);
var computeTHleg3 = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading3,
    TrueCourse3,
    WindDir3,
    WindSpeed3,
    TrueAirspd3,
);
var computeWCAleg3 = new ComputeWCAFromTHAndTC(WCA3, TrueHeading3, TrueCourse3);

// Compass Heading - Compass Heading, Magnetic Heading (NEW!)
var computeCompassHeadLeg3 = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding3,
    TrueHeading3,
    VarEW3,
    Deviation3,
);
var computeMagneticHeadLeg3 = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHding3,
    TrueHeading3,
    VarEW3,
);

// Ground Speed - Duration (ETE) & ETA (NEW!)
var computeTimeLeg3 = new ComputeTimeHMSFromDistanceAndSpeed(
    LegTime3,
    Distance3,
    GrndSpeed3,
);
var computeETAleg3 = new ComputeETAfromTimeAndStart(ETA3, LegTime3, LegStart3);

// Fuel - Fuel Amout
var computeFuelLeg3 = new ComputeAmountUSGalFromRateAndDuration(
    FuelVol3,
    FuelRate3,
    LegTime3,
);

// Dummy equations - set preferred units (& catch unit changes?)
// angle - TC, WDir, Var, Dev
var computeTCleg3 = new ComputeAngleFromAngle(TrueCourse3, TrueCourse3);
var computeWDirLeg3 = new ComputeAngleFromAngle(WindDir3, WindDir3);
var computeVarLeg3 = new ComputeAngle180FromAngle(VarEW3, VarEW3);
var computeDevLeg3 = new ComputeAngle180FromAngle(Deviation3, Deviation3);
// distance - Dist
var computeDistleg3 = new ComputeDistanceFromDistCheckSpeed(
    Distance3,
    Distance3,
    GrndSpeed3,
);
// ground speed - check dist units
var checkGndSpeedLeg3 = new ComputeGroundSpeedFromSpeedCheckUnits(
    GrndSpeed3,
    GrndSpeed3,
    Distance3,
);

// air speed - TAS, WSpd - and check for unit change in other airpseed input
var computeTASLeg3 = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd3,
    TrueAirspd3,
    WindSpeed3,
);
var computeWSpdLeg3 = new ComputeSpeedFromSpeedCheckUnits(
    WindSpeed3,
    WindSpeed3,
    TrueAirspd3,
);
// rate - FuelRate
var computeFuelRateleg3 = new ComputeRateFromRateCheckVol(
    FuelRate3,
    FuelRate3,
    FuelVol3,
);

// duration - Depart
// TODO: change to unit 'time' and set timezone (always HMS format)
var computeStartleg3 = new ComputeTimeFromTime(LegStart3, LegStart3);

CONST.tripPlanLeg3Equs = [
    computeDistleg3,
    computeTCleg3,
    computeTASLeg3,
    computeWDirLeg3,
    computeWSpdLeg3,
    computeVarLeg3,
    computeDevLeg3,
    computeFuelRateleg3,
    computeStartleg3,
    checkGndSpeedLeg3, //unit check only - don't add 2 GS variables (required to set equation active)
    computeGndSpeedLeg3,
    computeCompassHeadLeg3,
    computeMagneticHeadLeg3,
    computeTHleg3,
    computeWCAleg3,
    computeFuelLeg3,
    computeTimeLeg3,
    computeETAleg3,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - 4th Leg
// Wind Correction -Ground Speed, True Heading, Wind Correction Angle
var computeGndSpeedLeg4 = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed4,
    TrueAirspd4,
    WindSpeed4,
    WindDir4,
    TrueHeading4,
);
var computeTHleg4 = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading4,
    TrueCourse4,
    WindDir4,
    WindSpeed4,
    TrueAirspd4,
);
var computeWCAleg4 = new ComputeWCAFromTHAndTC(WCA4, TrueHeading4, TrueCourse4);

// Compass Heading - Compass Heading, Magnetic Heading (NEW!)
var computeCompassHeadLeg4 = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding4,
    TrueHeading4,
    VarEW4,
    Deviation4,
);
var computeMagneticHeadLeg4 = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHding4,
    TrueHeading4,
    VarEW4,
);

// Ground Speed - Duration (ETE) & ETA (NEW!)
var computeTimeLeg4 = new ComputeTimeHMSFromDistanceAndSpeed(
    LegTime4,
    Distance4,
    GrndSpeed4,
);
var computeETAleg4 = new ComputeETAfromTimeAndStart(ETA4, LegTime4, LegStart4);

// Fuel - Fuel Amout
var computeFuelLeg4 = new ComputeAmountUSGalFromRateAndDuration(
    FuelVol4,
    FuelRate4,
    LegTime4,
);

// Dummy equations - set preferred units (& catch unit changes?)
// angle - TC, WDir, Var, Dev
var computeTCleg4 = new ComputeAngleFromAngle(TrueCourse4, TrueCourse4);
var computeWDirLeg4 = new ComputeAngleFromAngle(WindDir4, WindDir4);
var computeVarLeg4 = new ComputeAngle180FromAngle(VarEW4, VarEW4);
var computeDevLeg4 = new ComputeAngle180FromAngle(Deviation4, Deviation4);
// distance - Dist
var computeDistleg4 = new ComputeDistanceFromDistCheckSpeed(
    Distance4,
    Distance4,
    GrndSpeed4,
);
// ground speed - check dist units
var checkGndSpeedLeg4 = new ComputeGroundSpeedFromSpeedCheckUnits(
    GrndSpeed4,
    GrndSpeed4,
    Distance4,
);

// air speed - TAS, WSpd - and check for unit change in other airpseed input
var computeTASLeg4 = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd4,
    TrueAirspd4,
    WindSpeed4,
);
var computeWSpdLeg4 = new ComputeSpeedFromSpeedCheckUnits(
    WindSpeed4,
    WindSpeed4,
    TrueAirspd4,
);
// rate - FuelRate
var computeFuelRateleg4 = new ComputeRateFromRateCheckVol(
    FuelRate4,
    FuelRate4,
    FuelVol4,
);
// duration - Depart
// TODO: change to unit 'time' and set timezone (always HMS format)
var computeStartleg4 = new ComputeTimeFromTime(LegStart4, LegStart4);

CONST.tripPlanLeg4Equs = [
    computeDistleg4,
    computeTCleg4,
    computeTASLeg4,
    computeWDirLeg4,
    computeWSpdLeg4,
    computeVarLeg4,
    computeDevLeg4,
    computeFuelRateleg4,
    computeStartleg4,
    checkGndSpeedLeg4, //unit check only - don't add 2 GS variables (required to set equation active)
    computeGndSpeedLeg4,
    computeCompassHeadLeg4,
    computeMagneticHeadLeg4,
    computeTHleg4,
    computeWCAleg4,
    computeFuelLeg4,
    computeTimeLeg4,
    computeETAleg4,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Trip Planner - 5th Leg
// Wind Correction -Ground Speed, True Heading, Wind Correction Angle
var computeGndSpeedLeg5 = new ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(
    GrndSpeed5,
    TrueAirspd5,
    WindSpeed5,
    WindDir5,
    TrueHeading5,
);
var computeTHleg5 = new ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(
    TrueHeading5,
    TrueCourse5,
    WindDir5,
    WindSpeed5,
    TrueAirspd5,
);
var computeWCAleg5 = new ComputeWCAFromTHAndTC(WCA5, TrueHeading5, TrueCourse5);

// Compass Heading - Compass Heading, Magnetic Heading (NEW!)
var computeCompassHeadLeg5 = new ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(
    CompHding5,
    TrueHeading5,
    VarEW5,
    Deviation5,
);
var computeMagneticHeadLeg5 = new ComputeMagHeadFromTrueHeadAndMagVar(
    MagneticHding5,
    TrueHeading5,
    VarEW5,
);

// Ground Speed - Duration (ETE) & ETA (NEW!)
var computeTimeLeg5 = new ComputeTimeHMSFromDistanceAndSpeed(
    LegTime5,
    Distance5,
    GrndSpeed5,
);
var computeETAleg5 = new ComputeETAfromTimeAndStart(ETA5, LegTime5, LegStart5);

// Fuel - Fuel Amout
var computeFuelLeg5 = new ComputeAmountUSGalFromRateAndDuration(
    FuelVol5,
    FuelRate5,
    LegTime5,
);

// Dummy equations - set preferred units (& catch unit changes?)
// angle - TC, WDir, Var, Dev
var computeTCleg5 = new ComputeAngleFromAngle(TrueCourse5, TrueCourse5);
var computeWDirLeg5 = new ComputeAngleFromAngle(WindDir5, WindDir5);
var computeVarLeg5 = new ComputeAngle180FromAngle(VarEW5, VarEW5);
var computeDevLeg5 = new ComputeAngle180FromAngle(Deviation5, Deviation5);
// distance - Dist
var computeDistleg5 = new ComputeDistanceFromDistCheckSpeed(
    Distance5,
    Distance5,
    GrndSpeed5,
);
// ground speed - check dist units
var checkGndSpeedLeg5 = new ComputeGroundSpeedFromSpeedCheckUnits(
    GrndSpeed5,
    GrndSpeed5,
    Distance5,
);

// air speed - TAS, WSpd - and check for unit change in other airpseed input
var computeTASLeg5 = new ComputeSpeedFromSpeedCheckUnits(
    TrueAirspd5,
    TrueAirspd5,
    WindSpeed5,
);
var computeWSpdLeg5 = new ComputeSpeedFromSpeedCheckUnits(
    WindSpeed5,
    WindSpeed5,
    TrueAirspd5,
);
// rate - FuelRate
var computeFuelRateleg5 = new ComputeRateFromRateCheckVol(
    FuelRate5,
    FuelRate5,
    FuelVol5,
);
// duration - Depart
// TODO: change to unit 'time' and set timezone (always HMS format)
var computeStartleg5 = new ComputeTimeFromTime(LegStart5, LegStart5);

CONST.tripPlanLeg5Equs = [
    computeDistleg5,
    computeTCleg5,
    computeTASLeg5,
    computeWDirLeg5,
    computeWSpdLeg5,
    computeVarLeg5,
    computeDevLeg5,
    computeFuelRateleg5,
    computeStartleg5,
    checkGndSpeedLeg5, //unit check only - don't add 2 GS variables (required to set equation active)
    computeGndSpeedLeg5,
    computeCompassHeadLeg5,
    computeMagneticHeadLeg5,
    computeTHleg5,
    computeWCAleg5,
    computeFuelLeg5,
    computeTimeLeg5,
    computeETAleg5,
];
