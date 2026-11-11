///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 821 $
// @date    $Date: 2012-05-14 11:26:04 -0700 (Mon, 14 May 2012) $
// @brief   Declarations of equations to calculate fuel consumption variables.
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_FUEL_EQUATIONS_H
//#define __INCLUDED_FUEL_EQUATIONS_H
//
//#include "LinearEquations.h"
//#include "definedUnits.h"

////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Rate from Fuel Volume & Duration
///  Also checks units
///
///    Rate = Volume/Duration
///
///     LinEqComputeMfromYandX::output = input1() / input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeRateFromFuelAndDuration(rateOutput, fuelInput, durationInput) {
  LinEqComputeMfromYandX.call(this, rateOutput, fuelInput, durationInput);
}
// ComputeRateFromFuelAndDuration is a subclass of LinEqComputeMfromYandX:
ComputeRateFromFuelAndDuration.inheritsFrom(LinEqComputeMfromYandX);

ComputeRateFromFuelAndDuration.prototype.checkPreferredUnits = function () {
  var idx = this.inputs_[0].getUnitIndex();
  var out_idx = this.output_.getUnitIndex();
  // in: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT
  // out: fule rate: LPH=0, US GPH, UK GPH
  if (idx > 2) {
    idx = idx - 2;
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

ComputeRateFromFuelAndDuration.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.FuelRateDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Volume (amount)  from Fuel Rate & Duration
///  Also checks units
///
///    Volume = Rate * Duration
///
///     LinEqComputeYfromMandX::output = input1() * input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeAmountFromRateAndDuration(amountOutput, rateInput, durationInput) {
  LinEqComputeYfromMandX.call(this, amountOutput, rateInput, durationInput);
}
// ComputeAmountFromRateAndDuration is a subclass of LinEqComputeYfromMandX:
ComputeAmountFromRateAndDuration.inheritsFrom(LinEqComputeYfromMandX);

ComputeAmountFromRateAndDuration.prototype.checkPreferredUnits = function () {
  var idx = this.inputs_[0].getUnitIndex();
  var out_idx = this.output_.getUnitIndex();
  // in: fule rate: LPH=0, US GPH, UK GPH
  // out: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT

  // check for US/UK GPH with vol=US/UK QT & match US/UK
  if ((out_idx > 2) && (idx != 0)) {
    idx = idx + 2;
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

ComputeAmountFromRateAndDuration.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.VolumeDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



function ComputeDurationFromAmountAndRate(durationOutput, amountInput, rateInput) {
  LinEqComputeXfromYandM.call(this, durationOutput, amountInput, rateInput);
}
// ComputeDurationFromAmountAndRate is a subclass of LinEqComputeXfromYandM:
ComputeDurationFromAmountAndRate.inheritsFrom(LinEqComputeXfromYandM);

ComputeDurationFromAmountAndRate.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(false);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.DurationDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Volume from Fuel Weight & Type
///  Also checks units
///
///    Volume = Weight/Type
///
///     LinEqComputeMfromYandX::output = input1() / input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeVolumeFromWeightAndType(volumeOutput, weightInput, typeInput) {
  LinEqComputeMfromYandX.call(this, volumeOutput, weightInput, typeInput);
}
// ComputeVolumeFromWeightAndType is a subclass of LinEqComputeMfromYandX:
ComputeVolumeFromWeightAndType.inheritsFrom(LinEqComputeMfromYandX);

ComputeVolumeFromWeightAndType.prototype.checkPreferredUnits = function () {
  // in: fuel weight: KG=0, LB
  // out: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT
  var idx = this.inputs_[0].getUnitIndex();
  var out_idx = this.output_.getUnitIndex();

  // check for switch between US/UK QT
  if (out_idx > 2) {
    idx = 4 - idx;
  }
  // check for conversion from UK to US GAL (no change back, next change will show liters)
  else if (out_idx == 2) {
    idx = 2 - idx;
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

ComputeVolumeFromWeightAndType.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.VolumeDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Weight from Fuel Volume & Type
///  Also checks units
///
///    Weight = Volume * Type
///
///     LinEqComputeYfromMandX::output = input1() * input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWeightFromVolumeAndType(weightOutput, volumeInput, typeInput) {
  LinEqComputeYfromMandX.call(this, weightOutput, volumeInput, typeInput);
}
// ComputeWeightFromVolumeAndType is a subclass of LinEqComputeYfromMandX:
ComputeWeightFromVolumeAndType.inheritsFrom(LinEqComputeYfromMandX);

ComputeWeightFromVolumeAndType.prototype.checkPreferredUnits = function () {
  // in: fuel vol: liters=0, US GAL, UK GAL, US QT, UK QT
  // out: fuel weight: KG=0, LB
  var idx = this.inputs_[0].getUnitIndex();
  var out_idx = this.output_.getUnitIndex();
  // match LB to US GAL/QT, KG to L and UK GAL/QT
  idx = idx & 0x01; //clear all except bit one

  // make sure matching units
  if (out_idx != idx) {
    // update preferred units & indicate output (unit) changed
    this.preferredUnits_.ptr = this.output_.kind().units()[idx];
    this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
    this.output_.setUnitLock(true);
    this.output_.changed();
  }

}

ComputeWeightFromVolumeAndType.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.WeightDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}




////////////////////////////////////////////////////////////////////////////////
///
///  Compute Fuel Type
///
///      From CX-2 manual:
///            AV GAS 6    lbs/gal
///            AV GAS 6.84 lbs/gal
///            AV GAS 7.5  lbs/gal
///
///    Convert Unit will change Fuel Type
///
///
////////////////////////////////////////////////////////////////////////////////
function ComputeFuelType(fuelTypeOut, fuelTypeIn) {
  Equation.call(this, fuelTypeOut, fuelTypeIn);
}
// ComputeFuelType is a subclass of Equation:
ComputeFuelType.inheritsFrom(Equation);

// compute fuel type
// assumes that inputs have value.
ComputeFuelType.prototype.compute = function () {
  var oldValue = this.output_.value();
  //values in LB/US GAL, convert to KB/L
  var lb_per_gal = 6.0 / 8.3454; //default Av Gas
  var idx = this.output_.getUnitIndex();
  if (idx == 1) {
    lb_per_gal = 6.84 / 8.3454; // jet fuel
  }
  else if (idx == 2) {
    lb_per_gal = 7.5 / 8.3454; // oil
  }

  if (oldValue != lb_per_gal) {
    //this.output_.setLock(false);
    this.output_.clearValue();
    this.output_.setValue(lb_per_gal);
  }

  return lb_per_gal;
}

ComputeFuelType.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(false);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = av_gas;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Weight  from Fuel Rate (KG/S) & Duration
///  Also checks units
///
///    Weight = WtRate * Duration
///
///     LinEqComputeYfromMandX::output = input1() * input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWeighttFromWtRateAndDuration(weightOutput, wtRateInput, durationInput) {
  LinEqComputeYfromMandX.call(this, weightOutput, wtRateInput, durationInput);
}
// ComputeWeighttFromWtRateAndDuration is a subclass of LinEqComputeYfromMandX:
ComputeWeighttFromWtRateAndDuration.inheritsFrom(LinEqComputeYfromMandX);

ComputeWeighttFromWtRateAndDuration.prototype.checkPreferredUnits = function() {
    // in: fuel weight rate: KG/HR=0, LB/HR
    // out:     fuel weight: KG=0,    LB
    var idx = this.inputs_[0].getUnitIndex();
    var out_idx = this.output_.getUnitIndex();

    // make sure matching units
    if (out_idx != idx) {
      // update preferred units & indicate output (unit) changed
      this.preferredUnits_.ptr = this.output_.kind().units()[idx];
      this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
      this.output_.setUnitLock(true);
      this.output_.changed();
    }

}

ComputeWeighttFromWtRateAndDuration.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.WeightDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///
///  Computes Fuel Rate (KG/S) from Fuel Weight & Duration
///  Also checks units
///
///    WtRate = Weight/Duration
///
///     LinEqComputeMfromYandX::output = input1() / input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWtRateFromWeightAndDuration(wtRateOutput, weightInput, durationInput) {
  LinEqComputeMfromYandX.call(this, wtRateOutput, weightInput, durationInput);
}
// ComputeWtRateFromWeightAndDuration is a subclass of LinEqComputeMfromYandX:
ComputeWtRateFromWeightAndDuration.inheritsFrom(LinEqComputeMfromYandX);

ComputeWtRateFromWeightAndDuration.prototype.checkPreferredUnits = function () {
  // in:     fuel weight: KG=0,    LB
  // out: fuel weight rate: KG/HR=0, LB/HR
  var idx = this.inputs_[0].getUnitIndex();
  var out_idx = this.output_.getUnitIndex();

  // make sure matching units
  if (out_idx != idx) {
    // update preferred units & indicate output (unit) changed
    this.preferredUnits_.ptr = this.output_.kind().units()[idx];
    this.output_.kind().setDefaultUnit(this.preferredUnits_.ptr);
    this.output_.setUnitLock(true);
    this.output_.changed();
  }

}

ComputeWtRateFromWeightAndDuration.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(true);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.FuelWtRateDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///
///  Computes Duration from Fuel Weight & Fuel Rate (KG/S)
///  Also checks units
///
///    WtRate = Weight/Duration
///
///     LinEqComputeXfromYandM::output = input1() / input2()
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDurationFromWeightAndWtRate(durationOutput, weightInput, wtRateInput) {
  LinEqComputeXfromYandM.call(this, durationOutput, weightInput, wtRateInput);
}
// ComputeDurationFromWeightAndWtRate is a subclass of LinEqComputeXfromYandM:
ComputeDurationFromWeightAndWtRate.inheritsFrom(LinEqComputeXfromYandM);

ComputeDurationFromWeightAndWtRate.prototype.setPreferredUnits = function () {
  this.output_.setUseDefaultUnit(false);

  if (this.preferredUnits_.ptr == null) {
    this.preferredUnits_.ptr = CONST.DurationDefault;
  }
  this.output_.setPreferredUnit(this.preferredUnits_);
}
