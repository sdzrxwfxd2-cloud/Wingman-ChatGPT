///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 820 $
// @date    $Date: 2012-05-10 17:17:36 -0700 (Thu, 10 May 2012) $
// @brief   Declarations of equations to calculate glide ratios
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_GLIDE_EQUATIONS_H
//#define __INCLUDED_GLIDE_EQUATIONS_H
//
//#include "LinearEquations.h"
//#include "definedUnits.h"


function ComputeRatioFromDistanceAndDescent(ratioOutput, distanceInput, descentInput) {
    LinEqComputeMfromYandX.call(this, ratioOutput, distanceInput, descentInput);
}
// ComputeRatioFromDistanceAndDescent is a subclass of LinEqComputeMfromYandX:
ComputeRatioFromDistanceAndDescent.inheritsFrom(LinEqComputeMfromYandX);

ComputeRatioFromDistanceAndDescent.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.RatioDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeDistanceFromRatioAndDescent(distanceOutput, ratioInput, descentInput) {
    LinEqComputeYfromMandX.call(this, distanceOutput, ratioInput, descentInput);
}
// ComputeDistanceFromRatioAndDescent is a subclass of LinEqComputeYfromMandX:
ComputeDistanceFromRatioAndDescent.inheritsFrom(LinEqComputeYfromMandX);

ComputeDistanceFromRatioAndDescent.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: descent: M=0, FT
    // out: dist:  NM=0,  KM,  SM, M, FT
    // skip if NM
    if (out_idx != 0) {
        idx++;  //match metric/US placement
        // check for M/FT change to KM/SM (don't convert short distance to long)
        if (out_idx > 2)
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
}


ComputeDistanceFromRatioAndDescent.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeDescentFromDistanceAndRatio(descentOutput, distanceInput, ratioInput) {
    LinEqComputeXfromYandM.call(this, descentOutput, distanceInput, ratioInput);
}
// ComputeDescentFromDistanceAndRatio is a subclass of LinEqComputeXfromYandM:
ComputeDescentFromDistanceAndRatio.inheritsFrom(LinEqComputeXfromYandM);

ComputeDescentFromDistanceAndRatio.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in:   dist:  NM=0,  KM,  SM, M, FT
    // out: descent: M=0, FT
    // skip if distance in NM
    if (idx != 0) {
        //decrement index and round down to 0 or 1
        idx--;
        idx &= 0x01;

        // make sure matching units
        if (out_idx != idx) {
            // update preferred units & indicate output (unit) changed
            this.preferredUnits_.ptr = this.output_.kind().units()[idx];
            this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
            this.output_.setUnitLock(true);
            this.output_.changed();
        }
    }
}

ComputeDescentFromDistanceAndRatio.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Climb & Descent equations - also check for unit changes 

////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Distance from Descent & Angle of Climb
///  Also checks units
///
///    AoC = Descent/Distance    Distance = Descent / AoC
///
///     LinEqComputeMfromYandX::output = this.input1() / this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDistanceFromDescentAndClimbAngle(distanceOutput, descentInput, climbAngleInput) {
    LinEqComputeMfromYandX.call(this, distanceOutput, descentInput, climbAngleInput);
}
// ComputeDistanceFromDescentAndClimbAngle is a subclass of LinEqComputeMfromYandX:
ComputeDistanceFromDescentAndClimbAngle.inheritsFrom(LinEqComputeMfromYandX);

ComputeDistanceFromDescentAndClimbAngle.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: descent: M=0, FT
    // out: dist:  NM=0,  KM,  SM, M, FT
    // skip if NM
    if (out_idx != 0) {
        idx++;  //match metric/US placement
        // check for M/FT change to KM/SM (don't convert short distance to long)
        if (out_idx > 2)
            idx += 2;
    }
    else {
        idx = out_idx;
    }

    // if matching units, check Angle of Climb
    if (out_idx == idx) {
        // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
        // out: dist:  NM=0,  KM,  SM, M, FT
        idx = this.inputs_[1].getUnitIndex();

        // NM: idx = 0 (M/NM) or 3 (FT/NM), convert to 0 for  output NM
        if (idx == 3)
            idx = 0;

        // don't change long units (KM,SM) to short (M,FT)
        if (idx != 0) {
            if (out_idx > 2)
                idx += 2;
        }
    }
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


ComputeDistanceFromDescentAndClimbAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Descent from Distance & Angle of Climb
///  Also checks units
///
///    AoC = Descent/Distance    Descent = Distance * AoC
///
///     LinEqComputeYfromMandX::output = this.input1() * this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDescentFromDistanceAndClimbAngle(descentOutput, distanceInput, climbAngleInput) {
    LinEqComputeYfromMandX.call(this, descentOutput, distanceInput, climbAngleInput);
}
// ComputeDescentFromDistanceAndClimbAngle is a subclass of LinEqComputeYfromMandX:
ComputeDescentFromDistanceAndClimbAngle.inheritsFrom(LinEqComputeYfromMandX);

ComputeDescentFromDistanceAndClimbAngle.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in:   dist:  NM=0,  KM,  SM, M, FT
    // out: descent: M=0, FT
    // skip if distance in NM
    if (idx != 0) {
        //decrement index and round down to 0 or 1
        idx--;
        idx &= 0x01;

    }
    else {
        idx = out_idx;
    }

    // if matching units, check Angle of Climb
    if (out_idx == idx) {
        // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
        // out: descent: M=0, FT
        idx = this.inputs_[1].getUnitIndex();

        // input idx = 0,1 for meters, =2,3 for FT
        if (idx < 2)
            idx = 0;
        else
            idx = 1;
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeDescentFromDistanceAndClimbAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Angle of Climb from Descent &  Distance
///  Also checks units
///
///    AoC = Descent/Distance    
///
///     LinEqComputeMfromYandX::output = this.input1() / this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbAngleFromDescentAndDistance(climbAngleOutput, descentInput, distanceInput) {
    LinEqComputeMfromYandX.call(this, climbAngleOutput, descentInput, distanceInput);
}
// ComputeClimbAngleFromDescentAndDistance is a subclass of LinEqComputeMfromYandX:
ComputeClimbAngleFromDescentAndDistance.inheritsFrom(LinEqComputeMfromYandX);

ComputeClimbAngleFromDescentAndDistance.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in: descent: M=0, FT
    // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM

    // don't change NM <. KM/SM setting
    if (idx == 0) {
        // Roc metric (M/S)
        if (out_idx < 2) {
            // AoC also metric (M)
            idx = out_idx;
        }
        else {
            // convert from US to metric (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx--;      // FT/SM to M/KM
            idx &= 0x01;  // FT/NM to M/NM
            out_idx = 2;  // non-matching to set new default unit
        }
    }
    else {
        // Roc US (FPM)
        if (out_idx >= 2) {
            // AoC also US (FT)
            idx = out_idx;
        }
        else {
            // convert from metric to US (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx++;      // M/KM to FT/SM
            idx |= 0x02;  // M/NM to FT/NM 
            out_idx = 0;  // non-matching to set new default unit
        }
    }

    // if matching units, check distance
    if (out_idx == idx) {
        // in: dist:  NM=0,  KM,  SM, M, FT
        // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
        idx = this.inputs_[1].getUnitIndex();

        // convert short distances to long 
        if (idx > 2)
            idx -= 2;

        // NM: use x/NM (0 for M, 3 for FT)
        if (idx == 0) {
            if (out_idx < 2)
                idx = 0;
            else
                idx = 3;
        }
    }
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


ComputeClimbAngleFromDescentAndDistance.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbAngeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Ground Speed from Rate of Climb & Angle of Climb
///  Also checks units
///
///    RoC = AoC * GS      GS = RoC / AoC
///
///     LinEqComputeMfromYandX::output = this.input1() / this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromClimbRateAndAngle(speedOutput, climbRateInput, climbAngleInput) {
    LinEqComputeMfromYandX.call(this, speedOutput, climbRateInput, climbAngleInput);
}
// ComputeSpeedFromClimbRateAndAngle is a subclass of LinEqComputeMfromYandX:
ComputeSpeedFromClimbRateAndAngle.inheritsFrom(LinEqComputeMfromYandX);

ComputeSpeedFromClimbRateAndAngle.prototype.checkPreferredUnits = function () {
    // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    // out:   ground speed: KTS=0, KPH, MPH
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // NM/KTS idx=0,3
    if (idx > 2)
        idx = 0;

    // if matching AoC, check climb rate
    if (out_idx == idx) {
        // in: climb rate: M/S=0, FPM
        // out: speed: KTS=0, KPH, MPH
        idx = this.inputs_[0].getUnitIndex();

        // ignore if output unit KTS
        if (out_idx == 0)
            idx = out_idx;
        else
            idx++;
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


LinEqComputeMfromYandX.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Angle of Climb from Rate of Climb & Ground Speed 
///  Also checks units
///
///    RoC = AoC * GS      AoC = RoC / GS
///
///     LinEqComputeMfromYandX::output = this.input1() / this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbAngleFromClimbRateAndSpeed(climbAngleOutput, climbRateInput, speedInput) {
    LinEqComputeMfromYandX.call(this, climbAngleOutput, climbRateInput, speedInput);
}
// ComputeClimbAngleFromClimbRateAndSpeed is a subclass of LinEqComputeMfromYandX:
ComputeClimbAngleFromClimbRateAndSpeed.inheritsFrom(LinEqComputeMfromYandX);

ComputeClimbAngleFromClimbRateAndSpeed.prototype.checkPreferredUnits = function () {
    // in:   rate of climb: M/S=0, FPM
    // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // don't change NM <. KM/SM setting
    if (idx == 0) {
        // Roc metric (M/S)
        if (out_idx < 2) {
            // AoC also metric (M)
            idx = out_idx;
        }
        else {
            // convert from US to metric (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx--;      // FT/SM to M/KM
            idx &= 0x01;  // FT/NM to M/NM
            out_idx = 2;  // non-matching to set new default unit
        }
    }
    else {
        // Roc US (FPM)
        if (out_idx >= 2) {
            // AoC also US (FT)
            idx = out_idx;
        }
        else {
            // convert from metric to US (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx++;      // M/KM to FT/SM
            idx |= 0x02;  // M/NM to FT/NM 
            out_idx = 0;  // non-matching to set new default unit
        }
    }

    // if matching RoC unit, check GS units
    if (out_idx == idx) {
        // in:    ground speed: KTS=0, KPH, MPH
        // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
        idx = this.inputs_[1].getUnitIndex();

        // KTS: use x/NM (0 for M, 3 for FT)
        if (idx == 0) {
            if (out_idx < 2)
                idx = 0;
            else
                idx = 3;
        }
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}


ComputeClimbAngleFromClimbRateAndSpeed.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbAngeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Rate of Climb from Ground Speed & Angle of Climb  
///  Also checks units
///
///    RoC = AoC * GS      
///
///     LinEqComputeYfromMandX::output = this.input1() * this.input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbRateFromSpeedAndClimbAngle(climbRateOutput, speedInput, climbAngleInput) {
    LinEqComputeYfromMandX.call(this, climbRateOutput, speedInput, climbAngleInput);
}
// ComputeClimbRateFromSpeedAndClimbAngle is a subclass of LinEqComputeYfromMandX:
ComputeClimbRateFromSpeedAndClimbAngle.inheritsFrom(LinEqComputeYfromMandX);

ComputeClimbRateFromSpeedAndClimbAngle.prototype.checkPreferredUnits = function () {
    // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    // out: rate of climb: M/S=0, FPM
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // M (NM or KM) 0, 1  
    if (idx < 2)
        idx = 0;
    // FT (SM or NM) 2, 3
    else
        idx = 1;

    // if matching units - check ground speed units
    if (out_idx == idx) {
        // in:  ground speed: KTS=0, KPH, MPH
        // out: rate of climb: M/S=0, FPM
        idx = this.inputs_[0].getUnitIndex();

        // ignore if GS = KTS
        if (idx == 0)
            idx = out_idx;
        else
            idx--;
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeClimbRateFromSpeedAndClimbAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbRateDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Climb & Descent equations
function ComputeClimbRatioFromDistanceAndDescent(ratioOutput, distanceInput, descentInput) {
    LinEqComputeMfromYandX.call(this, ratioOutput, distanceInput, descentInput);
}
// ComputeClimbRatioFromDistanceAndDescent is a subclass of LinEqComputeMfromYandX:
ComputeClimbRatioFromDistanceAndDescent.inheritsFrom(LinEqComputeMfromYandX);

ComputeClimbRatioFromDistanceAndDescent.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.RatioDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Distance from Descent & Climb Ratio
///
///    Also checks Descent AND Ground Speed units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbDistanceFromRatioAndDescent(distanceOutput, ratioInput, descentInput, speedInput) {
    Equation.call(this, distanceOutput, ratioInput, descentInput, speedInput);
}
// ComputeClimbDistanceFromRatioAndDescent is a subclass of Equation:
ComputeClimbDistanceFromRatioAndDescent.inheritsFrom(Equation);

// can compute - ONLY check Descent & Ratio input (others look for unit changes only)
ComputeClimbDistanceFromRatioAndDescent.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue() && this.inputs_[1].hasValue())
        return true;

    return false;
}

// compute speed = ratio * descent
// assumes that inputs have value.
ComputeClimbDistanceFromRatioAndDescent.prototype.compute = function () {
    return this.input1() * this.input2();
}

ComputeClimbDistanceFromRatioAndDescent.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // make sure matching units


    // in: descent: M=0, FT
    // out: dist:  NM=0,  KM,  SM, M, FT
    // skip if NM
    if (out_idx != 0) {
        idx++;  //match metric/US placement
        // check for M/FT change to KM/SM (don't convert short distance to long)
        if (out_idx > 2)
            idx += 2;
    }
    else {
        idx = out_idx;
    }

    // if matching units - check ground speed units
    if (out_idx == idx) {
        // in: speed: KTS=0, KPH, MPH
        // out: dist:  NM=0,  KM,  SM, M, FT
        idx = this.inputs_[2].getUnitIndex();

        // check for M/FT change to KPH/MPH (don't convert short distance to long)
        if ((out_idx > 2) && (idx != 0))
            idx += 2;
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }

}

ComputeClimbDistanceFromRatioAndDescent.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Descent from Distance & Climb Ratio
///
///    Also checks Distance AND Rate of Climb units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbDescentFromDistanceAndRatio(descentOutput, distanceInput, ratioInput, climbRateInput) {
    Equation.call(this, descentOutput, distanceInput, ratioInput, climbRateInput);
}
// ComputeClimbDescentFromDistanceAndRatio is a subclass of Equation:
ComputeClimbDescentFromDistanceAndRatio.inheritsFrom(Equation);

// can compute - ONLY check Distance & Ratio input (others look for unit changes only)
ComputeClimbDescentFromDistanceAndRatio.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue() && this.inputs_[1].hasValue())
        return true;

    return false;
}

// compute descent = distance / ratio
// assumes that inputs have value.
ComputeClimbDescentFromDistanceAndRatio.prototype.compute = function () {
    return this.input1() / this.input2();
}

ComputeClimbDescentFromDistanceAndRatio.prototype.checkPreferredUnits = function () {
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();
    // in:   dist:  NM=0,  KM,  SM, M, FT
    // out: descent: M=0, FT
    // skip if distance in NM
    if (idx != 0) {
        //decrement index and round down to 0 or 1
        idx--;
        idx &= 0x01;

    }
    else {
        idx = out_idx;
    }

    // if matching units - check rate of climb units
    if (out_idx == idx) {
        // in: rate of climb: M/S=0, FPM
        // out:     descent: M=0,    FT
        idx = this.inputs_[2].getUnitIndex();
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }

}

ComputeClimbDescentFromDistanceAndRatio.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Ground Speed from Rate of Climb & Climb Ratio
///
///    Also checks Distance AND Angle of Climb units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromRateAndRatio(speedOutput, climbRateInput, ratioInput, angleInput, distInput) {
    Equation.call(this, speedOutput, climbRateInput, ratioInput, angleInput, distInput);
}
// ComputeSpeedFromRateAndRatio is a subclass of Equation:
ComputeSpeedFromRateAndRatio.inheritsFrom(Equation);

// can compute - ONLY check Climb Rate & Ratio input (others look for unit changes only)
ComputeSpeedFromRateAndRatio.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue() && this.inputs_[1].hasValue())
        return true;

    return false;
}

// compute Ground Speed
// assumes that inputs have value.
ComputeSpeedFromRateAndRatio.prototype.compute = function () {

    return (this.input1() * this.input2());
}

ComputeSpeedFromRateAndRatio.prototype.checkPreferredUnits = function () {
    // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    // out:   ground speed: KTS=0, KPH, MPH
    var idx = this.inputs_[2].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // NM/KTS idx=0,3
    if (idx > 2)
        idx = 0;

    // if matching AoC, check distance
    if (out_idx == idx) {
        // in:   dist:  NM=0,  KM,  SM, M, FT
        // out: speed: KTS=0, KPH, MPH
        idx = this.inputs_[3].getUnitIndex();
        if (idx > 2)
            idx -= 2;
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeSpeedFromRateAndRatio.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Rate of Climb when Climb Ratio and Ground Speed are known
///
///    Also checks Angle of Climb  AND ground speed units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbRateFromSpeedAndRatio(climbRateOutput, speedInput, ratioInput, climbAngleInput, descentInput) {
    Equation.call(this, climbRateOutput, speedInput, ratioInput, climbAngleInput, descentInput);
}
// ComputeClimbRateFromSpeedAndRatio is a subclass of Equation:
ComputeClimbRateFromSpeedAndRatio.inheritsFrom(Equation);

// can compute - ONLY check Speed & Ratio input (others look for unit changes only)
ComputeClimbRateFromSpeedAndRatio.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue() && this.inputs_[1].hasValue())
        return true;

    return false;
}

// compute Rate of Climb = Ground Speed /  Climb Ratio
// assumes that inputs have value.
ComputeClimbRateFromSpeedAndRatio.prototype.compute = function () {
    return this.input1() / this.input2();
}

ComputeClimbRateFromSpeedAndRatio.prototype.checkPreferredUnits = function () {
    // in: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    // out: rate of climb: M/S=0, FPM
    var idx = this.inputs_[2].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // M (NM or KM) 0, 1  
    if (idx < 2)
        idx = 0;
    // FT (SM or NM) 2, 3
    else
        idx = 1;
    // if matching units - check descent units
    if (out_idx == idx) {
        // in:        descent: M=0,   FT
        // out: rate of climb: M/S=0, FPM
        idx = this.inputs_[3].getUnitIndex();
    }
    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeClimbRateFromSpeedAndRatio.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbRateDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeRatioFromSpeedAndClimbRate(ratioOutput, speedInput, climbRateInput) {
    LinEqComputeMfromYandX.call(this, ratioOutput, speedInput, climbRateInput);
}
// ComputeRatioFromSpeedAndClimbRate is a subclass of LinEqComputeMfromYandX:
ComputeRatioFromSpeedAndClimbRate.inheritsFrom(LinEqComputeMfromYandX);

ComputeRatioFromSpeedAndClimbRate.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.RatioDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Rate of Climb when Distance, Descent, and Ground Speed are known
///
///    Also checks Descent units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeROCFromDistAndDescAndGS(climbRateOutput, distanceInput, descentInput, speedInput) {
    Equation.call(this, climbRateOutput, distanceInput, descentInput, speedInput);
}
// ComputeROCFromDistAndDescAndGS is a subclass of Equation:
ComputeROCFromDistAndDescAndGS.inheritsFrom(Equation);

// compute Rate of Climb
// assumes that inputs have value.
ComputeROCFromDistAndDescAndGS.prototype.compute = function () {

    return ((this.input3() * this.input2()) / this.input1());
}
/*
   virtual void checkPreferredUnits() {
   var idx = this.inputs_[1].getUnitIndex();
   var out_idx = this.output_.getUnitIndex();
// in:        descent: M=0,   FT
// out: rate of climb: M/S=0, FPM
// make sure matching units
if (out_idx != idx) {
// update preferred units & indicate output (unit) changed
this.preferredUnits_.ptr = this.output_.kind().units()[idx];
this.output_.kind().defaultUnit(this.preferredUnits_);
this.output_.setUnitLock(true);
this.output_.changed();
}
} */


ComputeROCFromDistAndDescAndGS.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbRateDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Angle of Climb from Climb Ratio
///
///    Also checks Rate of Climb AND ground speed units
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbAngleFromClimbRatio(climbAngleOutput, climbRatioInput, climbRateInput, speedInput) {
    Equation.call(this, climbAngleOutput, climbRatioInput, climbRateInput, speedInput);
}
// ComputeClimbAngleFromClimbRatio is a subclass of Equation:
ComputeClimbAngleFromClimbRatio.inheritsFrom(Equation);

// implementation: can compute - ONLY check Climb Ratio input (others look for unit changes only)
ComputeClimbAngleFromClimbRatio.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue())
        return true;

    return false;
}


// compute Angle of Climb
// assumes that inputs have value.
ComputeClimbAngleFromClimbRatio.prototype.compute = function () {

    return (1 / this.input1());
}

ComputeClimbAngleFromClimbRatio.prototype.checkPreferredUnits = function () {
    // in:   rate of climb: M/S=0, FPM
    // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
    var idx = this.inputs_[1].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // don't change NM <. KM/SM setting
    if (idx == 0) {
        // Roc metric (M/S)
        if (out_idx < 2) {
            // AoC also metric (M)
            idx = out_idx;
        }
        else {
            // convert from US to metric (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx--;      // FT/SM to M/KM
            idx &= 0x01;  // FT/NM to M/NM
            out_idx = 2;  // non-matching to set new default unit
        }
    }
    else {
        // Roc US (FPM)
        if (out_idx >= 2) {
            // AoC also US (FT)
            idx = out_idx;
        }
        else {
            // convert from metric to US (leave speed as is (nautical or US/metric)
            idx = out_idx;
            idx++;      // M/KM to FT/SM
            idx |= 0x02;  // M/NM to FT/NM 
            out_idx = 0;  // non-matching to set new default unit
        }
    }

    // if matching RoC unit, check GS units
    if (out_idx == idx) {
        // in:    ground speed: KTS=0, KPH, MPH
        // out: angle of climb: M/NM=0, M/KM, FT/SM, FT/NM
        idx = this.inputs_[2].getUnitIndex();

        // KTS: use x/NM (0 for M, 3 for FT)
        if (idx == 0) {
            if (out_idx < 2)
                idx = 0;
            else
                idx = 3;
        }
    }

    // make sure matching units
    if (out_idx != idx) {
        // update preferred units & indicate output (unit) changed
        this.preferredUnits_.ptr = this.output_.kind().units()[idx];
        this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
        this.output_.setUnitLock(true);
        this.output_.changed();
    }
}

ComputeClimbAngleFromClimbRatio.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.ClimbAngeDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Climb Ratio from Angle of Climb 
///
////////////////////////////////////////////////////////////////////////////////
function ComputeClimbRatioFromClimbAngle(climbRatioOutput, climbAngleInput) {
    Equation.call(this, climbRatioOutput, climbAngleInput);
}
// ComputeClimbRatioFromClimbAngle is a subclass of Equation:
ComputeClimbRatioFromClimbAngle.inheritsFrom(Equation);

// compute Rate of Climb
// assumes that inputs have value.
ComputeClimbRatioFromClimbAngle.prototype.compute = function () {

    return (1 / this.input1());
}

ComputeClimbRatioFromClimbAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.RatioDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



