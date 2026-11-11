///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 581 $
// @date    $Date: 2011-11-28 15:10:52 -0800 (Mon, 28 Nov 2011) $
// @brief   Declarations of equations used by trip planner but not declared elsewhere
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_TRIP_PLANNER_EQUATIONS_H
//#define __INCLUDED_TRIP_PLANNER_EQUATIONS_H
//
//#include "definedUnits.h"
//#include "variables.h"
//#include "equations.h"
//#include "LinearEquations.h"
//#include "CX3Equations.h"
//#include "calculator.h"


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Leg ETA 
///
/// TODO: change units to 'time' and set prefered unit to timezone (generic if just one permitted)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeETAfromTimeAndStart(ETAoutput, timeInput, startInput) {
    Equation.call(this, ETAoutput, timeInput, startInput);
}
// ComputeETAfromTimeAndStart is a subclass of Equation:
ComputeETAfromTimeAndStart.inheritsFrom(Equation);

// compute ETA
// assumes that inputs have value.
ComputeETAfromTimeAndStart.prototype.compute = function () {
    var out = this.input1() + this.input2();

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    return out;
}

ComputeETAfromTimeAndStart.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Leg ETE (duration, default HMS)
///
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTimeHMSFromDistanceAndSpeed(timeOutput, distanceInput, speedInput) {
    LinEqComputeXfromYandM.call(this, timeOutput, distanceInput, speedInput);
}
// ComputeTimeHMSFromDistanceAndSpeed is a subclass of LinEqComputeXfromYandM:
ComputeTimeHMSFromDistanceAndSpeed.inheritsFrom(LinEqComputeXfromYandM);

ComputeTimeHMSFromDistanceAndSpeed.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefaultHMS;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


function ComputeAmountUSGalFromRateAndDuration(amountOutput, rateInput, durationInput) {
    LinEqComputeYfromMandX.call(this, amountOutput, rateInput, durationInput);
}
// ComputeAmountUSGalFromRateAndDuration is a subclass of LinEqComputeYfromMandX:
ComputeAmountUSGalFromRateAndDuration.inheritsFrom(LinEqComputeYfromMandX);

ComputeAmountUSGalFromRateAndDuration.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: fule rate: LPH=0, US GPH, UK GPH
    // out: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT

    // check for US/UK GPH with vol=US/UK QT & match US/UK
    if ((out_idx > 2) && (idx != 0))
        idx += 2;
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }

}

ComputeAmountUSGalFromRateAndDuration.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.VolumeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Total Trip Distance - Legs 1 to 5
///
/// TODO: add items 2-5, all items only if active (see Weight & Balance)
//  TODO how to indicate active items? W&B in CX3equations, TP in TripPlanner
////////////////////////////////////////////////////////////////////////////////
function ComputeTotalDistanceLegs1to5(totalDistOut, dist1input, dist2input, dist3input, dist4input, dist5input) {
    Equation.call(this, totalDistOut, dist1input, dist2input, dist3input, dist4input, dist5input);
}
// ComputeTotalDistanceLegs1to5 is a subclass of Equation:
ComputeTotalDistanceLegs1to5.inheritsFrom(Equation);

// implementation: can compute if all acitve inputs have values
// OR no active inputs (for intermediate values ONLY - if more than 4 legs)
ComputeTotalDistanceLegs1to5.prototype.canCompute = function () {
    var has_inputs = false;
    for (var i in this.inputs_) {
        // only check if varaible is active
        if (this.inputs_[i].isActive()) {
            has_inputs = true;
            if (!this.inputs_[i].hasValue())
                return false;
        }
    }
    // only valid if at least 1 active input
    return has_inputs;
}

// compute Total Distance - up to 4 legs
// assumes that inputs have value.
ComputeTotalDistanceLegs1to5.prototype.compute = function () {
    var out = 0;
    for (var i in this.inputs_) {
        // only get active inputs
        if (this.inputs_[i].isActive()) {
            out += this.inputs_[i].value();
        }
    }

    return out;
}

ComputeTotalDistanceLegs1to5.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Total Trip Duration (ETE) - Legs 1 to 5
///
/// TODO: add items 2-5, all items only if active (see Weight & Balance)
//  TODO how to indicate active items? W&B in CX3equations, TP in TripPlanner
////////////////////////////////////////////////////////////////////////////////
function ComputeTotalDurationLegs1to5(totalDurOut, dur1input, dur2input, dur3input, dur4input, dur5input) {
    Equation.call(this, totalDurOut, dur1input, dur2input, dur3input, dur4input, dur5input);
}
// ComputeTotalDurationLegs1to5 is a subclass of Equation:
ComputeTotalDurationLegs1to5.inheritsFrom(Equation);

// implementation: can compute if all acitve inputs have values
// OR no active inputs (for intermediate values ONLY)
ComputeTotalDurationLegs1to5.prototype.canCompute = function () {
    var has_inputs = false;
    for (var i in this.inputs_) {
        // only check if varaible is active
        if (this.inputs_[i].isActive()) {
            has_inputs = true;
            if (!this.inputs_[i].hasValue())
                return false;
        }
    }
    // only valid if at least 1 active input
    return has_inputs;
}

// compute Total Duration (ETE) - up to 5 legs
// assumes that inputs have value.
ComputeTotalDurationLegs1to5.prototype.compute = function () {
    var out = 0;
    for (var i in this.inputs_) {
        // only get active inputs
        if (this.inputs_[i].isActive()) {
            out += this.inputs_[i].value();
        }
    }

    return out;
}

ComputeTotalDurationLegs1to5.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefaultHMS;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Total Trip ETA - Legs 1 to 5
///
/// TODO: add items 2-5, all items only if active (see Weight & Balance)
///  TODO how to indicate active items? W&B in CX3equations, TP in TripPlanner
///
/// TODO: change units to 'time' and set prefered unit to timezone (generic if just one permitted)
/// TODO: how to handle if intermediate legs deleted
/// TODO: =final ETA if no 'missing' legs? (leg 1, 1-3, 2-4, 4 for example)
////////////////////////////////////////////////////////////////////////////////
function ComputeTotalETALegs1to5(totalETAOut, ETA1input, ETA2input, ETA3input, ETA4input, ETA5input) {
    Equation.call(this, totalETAOut, ETA1input, ETA2input, ETA3input, ETA4input, ETA5input);
}
// ComputeTotalETALegs1to5 is a subclass of Equation:
ComputeTotalETALegs1to5.inheritsFrom(Equation);

// implementation: can compute if all acitve inputs have values
// OR no active inputs (for intermediate values ONLY)
// TODO: can compute only if no missing legs ???
ComputeTotalETALegs1to5.prototype.canCompute = function () {
    var has_inputs = false;
    for (var i in this.inputs_) {
        // only check if varaible is active
        if (this.inputs_[i].isActive()) {
            has_inputs = true;
            if (!this.inputs_[i].hasValue())
                return false;
        }
    }
    // only valid if at least 1 active input
    return has_inputs;
}

// compute Total Fuel - up to 5 legs
// assumes that inputs have value.
// NOTE: sets ETA to last computed leg ETA
// TODO: confirm this is expected output
ComputeTotalETALegs1to5.prototype.compute = function () {
    var out = 0;
    for (var i in this.inputs_) {
        // only get active inputs
        if (this.inputs_[i].isActive()) {
            out = this.inputs_[i].value();
        }
    }

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    return out;
}

ComputeTotalETALegs1to5.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Total Trip Fuel - Legs 1 to 5
///
/// TODO: add items 2-4, all items only if active (see Weight & Balance)
//  TODO how to indicate active items? W&B in CX3equations, TP in TripPlanner
////////////////////////////////////////////////////////////////////////////////
function ComputeTotalFuelLegs1to5(totalFuelOut, fuel1input, fuel2input, fuel3input, fuel4input, fuel5input) {
    Equation.call(this, totalFuelOut, fuel1input, fuel2input, fuel3input, fuel4input, fuel5input);
}
// ComputeTotalFuelLegs1to5 is a subclass of Equation:
ComputeTotalFuelLegs1to5.inheritsFrom(Equation);

// implementation: can compute if all acitve inputs have values
// OR no active inputs (for intermediate values ONLY)
ComputeTotalFuelLegs1to5.prototype.canCompute = function () {
    var has_inputs = false;
    for (var i in this.inputs_) {
        // only check if varaible is active
        if (this.inputs_[i].isActive()) {
            has_inputs = true;
            if (!this.inputs_[i].hasValue())
                return false;
        }
    }
    // only valid if at least 1 active input
    return has_inputs;
}

// compute Total Fuel - up to 5 legs
// assumes that inputs have value.
ComputeTotalFuelLegs1to5.prototype.compute = function () {
    var out = 0;
    for (var i in this.inputs_) {
        // only get active inputs
        if (this.inputs_[i].isActive()) {
            out += this.inputs_[i].value();
        }
    }

    return out;
}

ComputeTotalFuelLegs1to5.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.VolumeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}




////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for distance 
///    default unit: CONST.DistanceDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDistanceFromDistance(distOutput, distInput) {
    Equation.call(this, distOutput, distInput);
}
// ComputeDistanceFromDistance is a subclass of Equation:
ComputeDistanceFromDistance.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeDistanceFromDistance.prototype.compute = function () {
    return this.input1();
}

ComputeDistanceFromDistance.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for distance & check ground speed units
///    default unit: CONST.DistanceDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDistanceFromDistCheckSpeed(distOutput, distInput, speedInput) {
    Equation.call(this, distOutput, distInput, speedInput);
}
// ComputeDistanceFromDistCheckSpeed is a subclass of Equation:
ComputeDistanceFromDistCheckSpeed.inheritsFrom(Equation);

// implementation: can compute - ONLY check speedInput (others look for unit changes only)
ComputeDistanceFromDistCheckSpeed.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute distance
// assumes that inputs have value.
ComputeDistanceFromDistCheckSpeed.prototype.compute = function () {
    return this.input1();
}

ComputeDistanceFromDistCheckSpeed.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: speed: KTS=0, KPH, MPH
    // out: dist:  NM=0,  KM,  SM, M, FT

    // check for M/FT change to KPH/MPH (don't convert short distance to long)
    if ((out_idx > 2) && (idx != 0))
        idx += 2;
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


ComputeDistanceFromDistCheckSpeed.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for Length 
///    default unit: CONST.LengthDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeLengthFromLength(lenOutput, lenInput) {
    Equation.call(this, lenOutput, lenInput);
}
// ComputeLengthFromLength is a subclass of Equation:
ComputeLengthFromLength.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeLengthFromLength.prototype.compute = function () {
    return this.input1();
}

ComputeLengthFromLength.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.LengthDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for air speed
///    default unit: CONST.AirSpeedDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromSpeed(speedOutput, speedInput) {
    Equation.call(this, speedOutput, speedInput);
}
// ComputeSpeedFromSpeed is a subclass of Equation:
ComputeSpeedFromSpeed.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeSpeedFromSpeed.prototype.compute = function () {
    return this.input1();
}

ComputeSpeedFromSpeed.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for air speed 
/// ALSO checks 2nd variable to catch unit changes
///
///    default unit: CONST.AirSpeedDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromSpeedCheckUnits(speedOutput, speedInput, unitCheckInput) {
    Equation.call(this, speedOutput, speedInput, unitCheckInput);
}
// ComputeSpeedFromSpeedCheckUnits is a subclass of Equation:
ComputeSpeedFromSpeedCheckUnits.inheritsFrom(Equation);

// implementation: can compute - ONLY check speedInput (others look for unit changes only)
ComputeSpeedFromSpeedCheckUnits.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute speed (return current value)
// assumes that inputs have value.
ComputeSpeedFromSpeedCheckUnits.prototype.compute = function () {
    return this.input1();
}

ComputeSpeedFromSpeedCheckUnits.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for ground speed & check distance units
/// ALSO checks 2nd variable to catch unit changes
///
///    default unit: CONST.GroundSpeedDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeGroundSpeedFromSpeedCheckUnits(speedOutput, speedInput, distInput) {
    Equation.call(this, speedOutput, speedInput, distInput);
}
// ComputeGroundSpeedFromSpeedCheckUnits is a subclass of Equation:
ComputeGroundSpeedFromSpeedCheckUnits.inheritsFrom(Equation);

// implementation: can compute - ONLY check speedInput (others look for unit changes only)
ComputeGroundSpeedFromSpeedCheckUnits.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute speed (return current value)
// assumes that inputs have value.
ComputeGroundSpeedFromSpeedCheckUnits.prototype.compute = function () {
    return this.input1();
}

ComputeGroundSpeedFromSpeedCheckUnits.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in:   dist:  NM=0,  KM,  SM, M, FT
    // out: speed: KTS=0, KPH, MPH
    if (idx > 2)
        idx -= 2;
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }

}


ComputeGroundSpeedFromSpeedCheckUnits.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for fuel rate
///    default unit: CONST.FuelRateDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeRateFromRate(rateOutput, rateInput) {
    Equation.call(this, rateOutput, rateInput);
}
// ComputeRateFromRate is a subclass of Equation:
ComputeRateFromRate.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeRateFromRate.prototype.compute = function () {
    return this.input1();
}

ComputeRateFromRate.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.FuelRateDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for fuel rate & check fuel vol units
///    default unit: CONST.FuelRateDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeRateFromRateCheckVol(rateOutput, rateInput, volInput) {
    Equation.call(this, rateOutput, rateInput, volInput);
}
// ComputeRateFromRateCheckVol is a subclass of Equation:
ComputeRateFromRateCheckVol.inheritsFrom(Equation);

// implementation: can compute - ONLY check rateInput (others look for unit changes only)
ComputeRateFromRateCheckVol.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute angle
// assumes that inputs have value.
ComputeRateFromRateCheckVol.prototype.compute = function () {
    return this.input1();
}

ComputeRateFromRateCheckVol.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT
    // out: fule rate: LPH=0, US GPH, UK GPH
    if (idx > 2)
        idx -= 2;
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }

}

ComputeRateFromRateCheckVol.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.FuelRateDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}




////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for duration
///
/// TODO: adjust for timezone (currently default to PST)
//
////////////////////////////////////////////////////////////////////////////////
function ComputeTimeFromTime(timeOutput, timeInput) {
    Equation.call(this, timeOutput, timeInput);
}
// ComputeTimeFromTime is a subclass of Equation:
ComputeTimeFromTime.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeTimeFromTime.prototype.compute = function () {
    // make sure time entered is 0 to 24 hours
    return this.input1() % CONST.MAX_24HR_TIME;
}

ComputeTimeFromTime.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Flight Depart from ETA and Duration
///
///
////////////////////////////////////////////////////////////////////////////////
function ComputeStartfromDurAndETA(startoutput, durInput, ETAinput) {
    Equation.call(this, startoutput, durInput, ETAinput);
}
// ComputeStartfromDurAndETA is a subclass of Equation:
ComputeStartfromDurAndETA.inheritsFrom(Equation);

// compute ETA
// assumes that inputs have value.
ComputeStartfromDurAndETA.prototype.compute = function () {
    // make sure time entered is 0 to 24 hours
    return (this.input2() - this.input1()) % CONST.MAX_24HR_TIME;
}

ComputeStartfromDurAndETA.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.TimeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Flight Duration from ETA and Departure
///
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDurfromETAAndStart(timeoutput, timeInput, time2Input) {
    Equation.call(this, timeoutput, timeInput, time2Input);
}
// ComputeDurfromETAAndStart is a subclass of Equation:
ComputeDurfromETAAndStart.inheritsFrom(Equation);

// compute Duration
// assumes that inputs have value.
ComputeDurfromETAAndStart.prototype.compute = function () {
    var out = this.input2() - this.input1();

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    if (out < 0)
        out += CONST.MAX_24HR_TIME;

    return out;
}

ComputeDurfromETAAndStart.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DurationDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Local time from UTC or Destination time (used in settings: clock)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeLOCfromUTCorDES(timeoutput, timeInput, time2Input) {
    Equation.call(this, timeoutput, timeInput, time2Input);
}
// ComputeLOCfromUTCorDES is a subclass of Equation:
ComputeLOCfromUTCorDES.inheritsFrom(Equation);

// compute Local Time
// assumes that inputs have value.
ComputeLOCfromUTCorDES.prototype.compute = function () {
    var out = this.output_.value();

    if (out != this.input1())
        out = this.input1();
    else if (out != this.input2())
        out = this.input2();

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    return out;
}

ComputeLOCfromUTCorDES.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = time_local;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute UTC time from Local or Destination time (used in settings: clock)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeUTCfromLOCorDES(UTCoutput, LOCInput, DEStInput) {
    Equation.call(this, UTCoutput, LOCInput, DEStInput);
}
// ComputeUTCfromLOCorDES is a subclass of Equation:
ComputeUTCfromLOCorDES.inheritsFrom(Equation);

// compute time
// assumes that inputs have value.
ComputeUTCfromLOCorDES.prototype.compute = function () {
    var out = this.output_.value();

    if (out != this.input1())
        out = this.input1();
    else if (out != this.input2())
        out = this.input2();

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    return out;
}

ComputeUTCfromLOCorDES.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = time_utc;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Destination time from Local or UTC time (used in settings: clock)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDESfromLOCorUTC(UTCoutput, LOCInput, DEStInput) {
    Equation.call(this, UTCoutput, LOCInput, DEStInput);
}
// ComputeDESfromLOCorUTC is a subclass of Equation:
ComputeDESfromLOCorUTC.inheritsFrom(Equation);

// compute clock time
// assumes that inputs have value.
ComputeDESfromLOCorUTC.prototype.compute = function () {
    var out = this.output_.value();

    if (out != this.input1())
        out = this.input1();
    else if (out != this.input2())
        out = this.input2();

    // make sure time entered is 0 to 24 hours
    out %= CONST.MAX_24HR_TIME;

    return out;
}

ComputeDESfromLOCorUTC.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = time_dest;
    this.output_.setPreferredUnit(this.preferredUnits_);
}

