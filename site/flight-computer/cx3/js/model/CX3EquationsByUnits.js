///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 658 $
// @date    $Date: 2012-01-11 17:14:15 -0800 (Wed, 11 Jan 2012) $
// @brief   CX3 Equations grouped by equation's output variable's unit
//        Used to reset or change default units globally
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
//
//#ifdef __EWL_CPP__
//#pragma opt_usedef_mem_limit 560
//#endif
//
//using namespace Calculator;
//
//namespace CX3Equations
//{

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  GroundSpeed
CONST.groundspeedUnitEqus = [
    computeSpeed,
    computeSpeedFromROCandAOC,
    computeGndSpeed,
    computeGndSpeedLeg1,
    computeGndSpeedLeg2,
    computeGndSpeedLeg3,
    computeGndSpeedLeg4,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Airspeed
CONST.airspeedUnitEqus = [
    computeTASFromTrueTempAndMach,
    computeCASFromPAltAndMach,
    computeWindSpd,
    computeTAS,
    computeCrossWind,
    computeHeadWind,
    computeWindSpeed,
    computeTASLeg1,
    computeTASLeg2,
    computeTASLeg3,
    computeTASLeg4,
    computeWSpdLeg1,
    computeWSpdLeg2,
    computeWSpdLeg3,
    computeWSpdLeg4,
    checkTASunits,
    checkCASunits,
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Distance
CONST.distanceUnitEqus = [
    computeDistance,
    computeDistanceFromRatioAndDescent,
    computeDistanceFromDescAndAOC,
    computeDistABfromPosAB,
    computeDistBCfromPosBC,
    computeDistCDfromPosCD,
    computeTotalDistanceLegs1to5,
    computeDistleg1,
    computeDistleg2,
    computeDistleg3,
    computeDistleg4,
    checkDistABunit,
    checkDistBCunit,
    checkDistCDunit,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Length
CONST.lengthUnitEqus = [
    computeItem1Arm,
    computeItem2Arm,
    computeItem3Arm,
    computeItem4Arm,
    computeItem5Arm,
    computeItem6Arm,
    computeItem7Arm,
    computeItem8Arm,
    computeCenterOfGravity,
    computeChangeInArm,
    computeChangeInCG,
    computeMAC,
    computeMacCG,
    computeLMAC,
    computeAircraftArm,
    setAircraftFuelArm,
    setPilotArm,
    setFrontPsgrArm,
    setRearPsgrArm,
    setCargo1Arm,
    setCargo2Arm,
    computeAircraftCG,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Duration
CONST.durationUnitEqus = [
    computeTime,
    computeDurationFromAmountAndRate,
    computeDuration,
    computeTotalDurationLegs1to5,
    computeTimeLeg1,
    computeTimeLeg2,
    computeTimeLeg3,
    computeTimeLeg4,
    computeDurationFromWeightAndWtRate,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Temperature
CONST.temperatureUnitEqus = [
    computeTemperature,
    computeTrueTempFromIndTempAndMach,
    computeIndTempFromTrueTempAndMach,
    computeTrueTempFromIndTempAndTAS,
    computeIndTempFromTrueTempAndTAS,
    computeCBTemp,
    computeDewPoint,
    computeStdTempFromAltitude,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Altitude
CONST.altitudeUnitEqus = [
    computePressureAlt,
    computeIndicatedAlt,
    computeDensityAltitude,
    computePressureAlt2,
    computePressAltFromPressAlt,
    computeCloudBase,
    computeStdAltitudeFromPressure,
    computeDescentFromDistanceAndRatio,
    computeDescentFromDistAndAOC,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Pressure
CONST.pressureUnitEqus = [
    computeBarPressure,
    computeStdPresFromAltitide,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Output Unit -  Fuel Rate
CONST.fuelrateUnitEqus = [
    computeRateFromFuelandDur,
    computeFuelRateleg1,
    computeFuelRateleg2,
    computeFuelRateleg3,
    computeFuelRateleg4,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Output Unit -  Volume
CONST.fuelvolumeUnitEqus = [
    computeAmountFromRateAndDuration,
    computeTotalFuelLegs1to5,
    computeFuelLeg1,
    computeFuelLeg2,
    computeFuelLeg3,
    computeFuelLeg4,
    computeVolumeFromWeightAndType,
    computeAircraftFuelVolume,
];


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Output Unit -  Rate of Climb

CONST.ROCunitEqus = [
    computeROCFromSpeedAndAOC,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Output Unit -  Angle of Climb

CONST.AOCunitEqus = [
    computeAOCFromDescAndDist,
    computeAOCFromROCAndSpeed,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Weight
CONST.weightUnitEqus = [
    computeItem1Weight,
    computeItem2Weight,
    computeItem3Weight,
    computeItem4Weight,
    computeItem5Weight,
    computeItem6Weight,
    computeItem7Weight,
    computeItem8Weight,
    computeTotalWeight,
    computeChangeInItemWt,
    computeChangeInTotalWt,
    checklWeightUnits,
    computeWeightFromVolumeAndType,
    computeWeighttFromWtRateAndDuration,
    computeAircraftWeight,
    checkAircraftPilotUnits,
    checkAircraftFrontPsgrUnits,
    checkAircraftRearPsgrUnits,
    checkAircraftCargo1Units,
    checkAircraftCargo2Units,
    computeAircraftWeightTotal,
    checkProfileWeightUnits,
];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Torque
CONST.torqueUnitEqus = [
    computeItem1MOM,
    computeItem2MOM,
    computeItem3MOM,
    computeItem4MOM,
    computeItem5MOM,
    computeItem6MOM,
    computeItem7MOM,
    computeItem8MOM,
    computeTotalMOM,
    checklMomentUnits,
    computeAircraftMOM,
    computeAircraftMomTotal,
    checkProfileMomUnits,
];


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Output Unit -  Position (latitude and longitue - DMS or decimal degrees)
CONST.positionUnitEqus = [
    computeLatA,
    computeLongA,
    computeLatBfromTCrABandDistA,
    computeLonBfromTCrABandDistA,
    computeLatCfromTCrBCandDistB,
    computeLonCfromTCrBCandDistB,
    computeLatDfromTCrCDandDistC,
    computeLonDfromTCrCDandDistC,
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Output Unit -  Fuel Rate (weight/duration - base unit KG/S)

CONST.wtRateunitEqus = [
    computeWtRateFromWeightAndDuration,
];

//];
