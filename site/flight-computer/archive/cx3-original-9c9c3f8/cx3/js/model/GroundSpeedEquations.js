///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 820 $
// @date    $Date: 2012-05-10 17:17:36 -0700 (Thu, 10 May 2012) $
// @brief   Declarations of equations to calculate ground speed/time/distance.
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_GROUND_SPEED_EQUATIONS_H
//#define __INCLUDED_GROUND_SPEED_EQUATIONS_H
//
//#include "definedUnits.h"
//#include "variables.h"
//#include "equations.h"
//#include "LinearEquations.h"



function ComputeSpeedFromDistanceAndTime(speedOutput, distanceInput, timeInput) {
    LinEqComputeMfromYandX.call(this, speedOutput, distanceInput, timeInput);
}
// ComputeSpeedFromDistanceAndTime is a subclass of LinEqComputeMfromYandX:
ComputeSpeedFromDistanceAndTime.inheritsFrom(LinEqComputeMfromYandX);

ComputeSpeedFromDistanceAndTime.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var outIdx = this.output_.getUnitIndex();
    // in:   dist:  NM=0,  KM,  SM, M, FT
    // out: speed: KTS=0, KPH, MPH
    if (idx > 2) {
        idx -= 2;
    }
    // make sure matching units
    if (outIdx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeSpeedFromDistanceAndTime.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeDistanceFromSpeedAndTime(distanceOutput, speedInput, timeInput) {
    LinEqComputeYfromMandX.call(this, distanceOutput, speedInput, timeInput);
}
// ComputeDistanceFromSpeedAndTime is a subclass of LinEqComputeYfromMandX:
ComputeDistanceFromSpeedAndTime.inheritsFrom(LinEqComputeYfromMandX);

ComputeDistanceFromSpeedAndTime.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var outIdx = this.output_.getUnitIndex();
    // in: speed: KTS=0, KPH, MPH
    // out: dist:  NM=0,  KM,  SM, M, FT

    // check for M/FT change to KPH/MPH (don't convert short distance to long)
    if ((outIdx > 2) && (idx != 0)) {
        idx += 2;
    }
    // make sure matching units
    if (outIdx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


ComputeDistanceFromSpeedAndTime.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeTimeFromDistanceAndSpeed(timeOutput, distanceInput, speedInput) {
    LinEqComputeXfromYandM.call(this, timeOutput, distanceInput, speedInput);
}
// ComputeTimeFromDistanceAndSpeed is a subclass of LinEqComputeXfromYandM:
ComputeTimeFromDistanceAndSpeed.inheritsFrom(LinEqComputeXfromYandM);

ComputeTimeFromDistanceAndSpeed.prototype.setPreferredUnits = function () {
    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.DurationDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Convert Units - Dummy equations for unit changes
////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Speed & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromSpeedGS(speedOut, speedIn) {
    Equation.call(this, speedOut, speedIn);
}
// ComputeSpeedFromSpeedGS is a subclass of Equation:
ComputeSpeedFromSpeedGS.inheritsFrom(Equation);

// compute speed
// assumes that inputs have value.
ComputeSpeedFromSpeedGS.prototype.compute = function () {
    return this.input1();
}

ComputeSpeedFromSpeedGS.prototype.setPreferredUnits = function () {
    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Duration & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDurationFromDuration(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeDurationFromDuration is a subclass of Equation:
ComputeDurationFromDuration.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeDurationFromDuration.prototype.compute = function () {
    return this.input1();
}

ComputeDurationFromDuration.prototype.setPreferredUnits = function () {
    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.DurationDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Temperature & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTempFromTemp(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeTempFromTemp is a subclass of Equation:
ComputeTempFromTemp.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeTempFromTemp.prototype.compute = function () {
    return this.input1();
}

ComputeTempFromTemp.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Pressure & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputePressureFromPressure(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputePressureFromPressure is a subclass of Equation:
ComputePressureFromPressure.inheritsFrom(Equation);

// assumes that inputs have value.
ComputePressureFromPressure.prototype.compute = function () {
    return this.input1();
}

ComputePressureFromPressure.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.PressureDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Volume & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeVolumeFromVolume(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeVolumeFromVolume is a subclass of Equation:
ComputeVolumeFromVolume.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeVolumeFromVolume.prototype.compute = function () {
    return this.input1();
}

ComputeVolumeFromVolume.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.VolumeDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Weight & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWeightFromWeight(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeWeightFromWeight is a subclass of Equation:
ComputeWeightFromWeight.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeWeightFromWeight.prototype.compute = function () {
    return this.input1();
}

ComputeWeightFromWeight.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.WeightDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Rate of Climb & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeROCfromROC(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeROCfromROC is a subclass of Equation:
ComputeROCfromROC.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeROCfromROC.prototype.compute = function () {
    return this.input1();
}

ComputeROCfromROC.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.ClimbRateDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Angle of Climb & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeAOCfromAOC(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeAOCfromAOC is a subclass of Equation:
ComputeAOCfromAOC.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeAOCfromAOC.prototype.compute = function () {
    return this.input1();
}

ComputeAOCfromAOC.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.ClimbAngeDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Dummy to set prefered units for Torque & catch unit changes 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTorqueFromTorque(_out, _in) {
    Equation.call(this, _out, _in);
}
// ComputeTorqueFromTorque is a subclass of Equation:
ComputeTorqueFromTorque.inheritsFrom(Equation);

// assumes that inputs have value.
ComputeTorqueFromTorque.prototype.compute = function () {
    return this.input1();
}

ComputeTorqueFromTorque.prototype.setPreferredUnits = function () {
    //this.output_.setUseDefaultUnit(false);

    // check fo set default unit
    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TorqueDefault;
    }
    // set prefered unit of output
    this.output_.setPreferredUnit(this.preferredUnits_);
}
