///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 581 $
// @date    $Date: 2011-11-28 15:10:52 -0800 (Mon, 28 Nov 2011) $
// @brief   Equations used for calcuating various altitude values
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_RHUMB_LINE_EQUATIONS_H
//#define __INCLUDED_RHUMB_LINE_EQUATIONS_H
//
//#include "calculator.h"
//#include "CX3Equations.h"
//#include "variables.h"
//#include "equations.h"
//#include "math.h"


////////////////////////////////////////////////////////////////////////////////
///  
///  Base class for the Rhumb Line equations.  Contains some common formulas.
///
////////////////////////////////////////////////////////////////////////////////
//RhumbLineEquation.inheritsFrom(Equation);
var RhumbLineEquation = {

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute mod value:
    ///        mod=y - x * int(y/x) 
    ///        if (mod < 0) mod = mod + x 
    ///
    ///  @param [in] <x>, <y> 
    ///
    ///  @return <mod(y,x)>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_mod: function (y, x) {
        var mod = y - x * Math.floor(y / x);
        if (mod < 0)
            mod = mod + x;

        return mod;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute an intermediate value that is used in a couple of the 
    ///      Rhumb Line equations:
    ///      dphi =log (tan(lat2/2+pi/4)/tan(lat1/2+pi/4))
    ///
    ///  @param [in] <lat1> <in units of degrees (radians)>
    ///  @param [in] <lat2> <in units of degrees (radians)>
    ///
    ///  @return <computed value of dphi>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_dphi: function (lat1, lat2) {
        var x = Math.tan((lat2 / 2.0) + (CONST.PI / 4.0));
        var y = Math.tan((lat1 / 2.0) + (CONST.PI / 4.0));

        var dphi = Math.log(x / y);

        return dphi;
    }
};



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes the True Couse for shortest distance between two known position coordinates
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46:
///    http://williams.best.vwh.net/avform.htm#Mach
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTrueCourseFromPositionCoordinates(TCrsOutput, Lat1input, Lon1input, Lat2input, Lon2input) {
    Equation.call(this, TCrsOutput, Lat1input, Lon1input, Lat2input, Lon2input);
}
ComputeTrueCourseFromPositionCoordinates.inheritsFrom(Equation);

// compute True Couse 
// assumes that inputs have value.
ComputeTrueCourseFromPositionCoordinates.prototype.compute = function () {
    var q, tc;

    var dlon_W = RhumbLineEquation.compute_mod(this.input4() - this.input2(), 2 * CONST.PI);
    var dlon_E = RhumbLineEquation.compute_mod(this.input2() - this.input4(), 2 * CONST.PI);

    var dphi = RhumbLineEquation.compute_dphi(this.input1(), this.input3());

    if (dlon_W < dlon_E)      // Westerly rhumb line is the shortest
        q = Math.atan2(-dlon_W, dphi);
    else
        q = Math.atan2(dlon_E, dphi);

    tc = RhumbLineEquation.compute_mod(q, 2 * CONST.PI);

    //TODO: normalize??
    return tc;
}

ComputeTrueCourseFromPositionCoordinates.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes the shortest distance between two known position coordinates
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46:
///    http://williams.best.vwh.net/avform.htm#Mach
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDistanceFromPositionCoordinates(DistOutput, Lat1input, Lon1input, Lat2input, Lon2input) {
    Equation.call(this, DistOutput, Lat1input, Lon1input, Lat2input, Lon2input);
}
ComputeDistanceFromPositionCoordinates.inheritsFrom(Equation);

// compute Distance
// NOTE: distance computed in radians - 
// assumes that inputs have value.
ComputeDistanceFromPositionCoordinates.prototype.compute = function () {
    var q, d, x, y;

    var dlon_W = RhumbLineEquation.compute_mod(this.input4() - this.input2(), 2 * CONST.PI);
    var dlon_E = RhumbLineEquation.compute_mod(this.input2() - this.input4(), 2 * CONST.PI);

    var dphi = RhumbLineEquation.compute_dphi(this.input1(), this.input3());

    if (Math.abs(this.input3() - this.input1()) < CONST.Tol)
        q = Math.cos(this.input1());
    else
        q = (this.input3() - this.input1()) / dphi;

    if (dlon_W < dlon_E)      // Westerly rhumb line is the shortest
        x = q * q * dlon_W * dlon_W;
    else
        x = q * q * dlon_E * dlon_E;

    y = this.input3() - this.input1();
    y = y * y;
    d = Math.pow((x + y), 0.5);
    //convert to meters  (60*180/pi)(nm/rad)*(1852)(M/nm)
    // 60*180/
    x = d * (60 * 180 / CONST.PI) * (1852);

    return x;
}

ComputeDistanceFromPositionCoordinates.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes final longitude given true course and distance
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46:
///    http://williams.best.vwh.net/avform.htm#Mach
///
////////////////////////////////////////////////////////////////////////////////
function ComputeLonFromTrueCourseAndDistance(Lon2output, Lat1input, Lon1input, TCinput, DistInput) {
    Equation.call(this, Lon2output, Lat1input, Lon1input, TCinput, DistInput);
}
ComputeLonFromTrueCourseAndDistance.inheritsFrom(Equation);

// compute Longitude
// assumes that inputs have value.
ComputeLonFromTrueCourseAndDistance.prototype.compute = function () {
    var q, dlon, x;

    // convert distance from meters to radians
    // d_rad = DistInput*(CONST.PI/(180*60)(rad/nm)*(1/1852)(nm/meter)
    var d_rad = this.input4() * CONST.PI / (180 * 60 * 1852);

    var lat2 = this.input1() + d_rad * Math.cos(this.input3());

    if (Math.abs(lat2) > (CONST.PI / 2)) {   //ERROR: distance too large 
        //TODO: message with indiation of error?
        this.calculationError_ = true;
        //TODO: set no value for output???
        //return (ERROR_VALUE);
    }

    if (Math.abs(lat2 - this.input1()) < CONST.Tol) {
        q = Math.cos(this.input1());
    }
    else {
        var dphi = RhumbLineEquation.compute_dphi(this.input1(), lat2);
        q = (lat2 - this.input1()) / dphi;
    }

    dlon = -d_rad * Math.sin(this.input3()) / q;
    x = RhumbLineEquation.compute_mod(this.input2() + dlon + CONST.PI, 2.0 * CONST.PI);
    var lon = x - CONST.PI;

    //TODO: normalize??
    return lon;
}

ComputeLonFromTrueCourseAndDistance.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDMSDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes final latitude given true course and distance
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46:
///    http://williams.best.vwh.net/avform.htm#Mach
///
////////////////////////////////////////////////////////////////////////////////
function ComputeLatFromTrueCourseAndDistance(Lat2output, Lat1input, Lon1input, TCinput, DistInput) {
    Equation.call(this, Lat2output, Lat1input, Lon1input, TCinput, DistInput);
}
ComputeLatFromTrueCourseAndDistance.inheritsFrom(Equation);

// compute Longitude
// assumes that inputs have value.
ComputeLatFromTrueCourseAndDistance.prototype.compute = function () {
    // convert distance from meters to radians
    // d_rad = DistInput*(CONST.PI/(180*60)(rad/nm)*(1/1852)(nm/meter)
    var d_rad = this.input4() * CONST.PI / (180 * 60 * 1852);

    var lat2 = this.input1() + d_rad * Math.cos(this.input3());

    if (Math.abs(lat2) > (CONST.PI / 2)) {   //ERROR: distance too large 
        //TODO: message with indiation of error?
        this.calculationError_ = true;
        //TODO: set no value for output???
        //return (ERROR_VALUE);
    }

    //TODO: normalize??
    return lat2;
}

ComputeLatFromTrueCourseAndDistance.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDMSDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for Point A latitude and longitude (angle DMS)
///    (currently no equations to set Point A from other variables
///
////////////////////////////////////////////////////////////////////////////////
function ComputePointAFromPointA(angleOutput, angleInput) {
    Equation.call(this, angleOutput, angleInput);
}
ComputePointAFromPointA.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputePointAFromPointA.prototype.compute = function () {
    //TODO: normalize??
    return this.input1();
}

ComputePointAFromPointA.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDMSDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set check for distance default unit change
///    default unit: CONST.DistanceDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDistanceFromDistanceCheckUnits(distOutput, distInput, distInput2) {
    Equation.call(this, distOutput, distInput, distInput2);
}
ComputeDistanceFromDistanceCheckUnits.inheritsFrom(Equation);

// implementation: can compute - ONLY check speedInput (others look for unit changes only)
ComputeDistanceFromDistanceCheckUnits.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute angle
// assumes that inputs have value.
ComputeDistanceFromDistanceCheckUnits.prototype.compute = function () {
    return this.input1();
}

ComputeDistanceFromDistanceCheckUnits.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.DistanceDefault;
    //this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for latitude and longitude (angle DMS)
/// ALSO checks corresonding variable for unit change (DMS to/from decimal degrees)
///
///    default unit: CONST.AngleDMSDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeAngleFromAngleCheckUnits(angleOutput, angleInput, unitCheckInput, unitCheckInput2) {
    Equation.call(this, angleOutput, angleInput, unitCheckInput, unitCheckInput2);
}
ComputeAngleFromAngleCheckUnits.inheritsFrom(Equation);

// implementation: can compute - ONLY check 1st input (others look for unit changes only)
ComputeAngleFromAngleCheckUnits.prototype.canCompute = function () {
    return this.inputs_[0].hasValue();
}

// compute speed (return current value)
// assumes that inputs have value.
ComputeAngleFromAngleCheckUnits.prototype.compute = function () {
    return this.input1();
}

ComputeAngleFromAngleCheckUnits.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDMSDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for trip planner angle inputs (degrees)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeAngleFromAngle(angleOutput, angleInput) {
    Equation.call(this, angleOutput, angleInput);
}
ComputeAngleFromAngle.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeAngleFromAngle.prototype.compute = function () {
    //TODO: normalize??
    var tmp = this.input1();
    normalizeAngle(tmp);

    return this.input1();
}

ComputeAngleFromAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for trip planner angle inputs (+/- 180 for mag var/dev)
///
////////////////////////////////////////////////////////////////////////////////
function ComputeAngle180FromAngle(angleOutput, angleInput) {
    Equation.call(this, angleOutput, angleInput);
}
ComputeAngle180FromAngle.inheritsFrom(Equation);

// compute angle
// assumes that inputs have value.
ComputeAngle180FromAngle.prototype.compute = function () {
    //TODO: normalize??
    var tmp = this.input1();
    normalizeAngle(tmp);

    return this.input1();
}

ComputeAngle180FromAngle.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.Angle180Default;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to catch unit changes (add/remove) for Points and Rhumbline items
///    default prefered units: add_item
///
////////////////////////////////////////////////////////////////////////////////
function ComputeItemFromItem(itemOutput, itemInput) {
    Equation.call(this, itemOutput, itemInput);
}
ComputeItemFromItem.inheritsFrom(Equation);

// compute Pressure Altitude
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputeItemFromItem.prototype.compute = function () {
    return this.input1();
}

ComputeItemFromItem.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = item_add;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to catch unit changes (add/remove) for Points and Rhumbline items
///    default prefered units: item_noText
///
////////////////////////////////////////////////////////////////////////////////
function ComputeItemFromItemNoText(itemOutput, itemInput) {
    Equation.call(this, itemOutput, itemInput);
}
ComputeItemFromItemNoText.inheritsFrom(Equation);

// compute Pressure Altitude
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputeItemFromItemNoText.prototype.compute = function () {
    return this.input1();
}

ComputeItemFromItemNoText.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = item_noText;
    this.output_.setPreferredUnit(this.preferredUnits_);
}
