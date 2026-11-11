///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 790 $
// @date    $Date: 2012-04-10 16:17:20 -0700 (Tue, 10 Apr 2012) $
// @brief   Equations used for calcuating various altitude values
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_COMPASS_HEADING_EQUATIONS_H
//#define __INCLUDED_COMPASS_HEADING_EQUATIONS_H
//
//#include "calculator.h"
//#include "CX3Equations.h"
//#include "variables.h"
//#include "equations.h"
//#include "math.h"
//#include "WindCorrectionEquations.h"    //contains normalizeangle() function


////////////////////////////////////////////////////////////////////////////////
///  
///  Computes True Heading when Magnetic Variation, Magnetic Deviation, and
///  Compass Heading are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTrueHeadFromMagVarAndMagDevAndCompHead(trueHeadOut, magVarInput, magDevInput, compHeadInput) {
    Equation.call(this, trueHeadOut, magVarInput, magDevInput, compHeadInput);
}
// ComputeTrueHeadFromMagVarAndMagDevAndCompHead is a subclass of Equation:
ComputeTrueHeadFromMagVarAndMagDevAndCompHead.inheritsFrom(Equation);

// compute True Heading
// assumes that inputs have value.
ComputeTrueHeadFromMagVarAndMagDevAndCompHead.prototype.compute = function () {

    return normalizeAngle(this.input3() - this.input2() - this.input1());
}

ComputeTrueHeadFromMagVarAndMagDevAndCompHead.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Magnetic Deviation when True Heading, Magnetic Variation, and
///  Compass Heading are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeMagDevFromTrueHeadAndMagVarAndCompHead(magDevOut, trueHeadInput, magVarInput, compHeadInput) {
    Equation.call(this, magDevOut, trueHeadInput, magVarInput, compHeadInput);
}
// ComputeMagDevFromTrueHeadAndMagVarAndCompHead is a subclass of Equation:
ComputeMagDevFromTrueHeadAndMagVarAndCompHead.inheritsFrom(Equation);

// compute magnetic deviation
// assumes that inputs have value.
ComputeMagDevFromTrueHeadAndMagVarAndCompHead.prototype.compute = function () {
    var tmp = (this.input3() - this.input2() - this.input1());
    normalizeAngle(tmp);
    if (tmp > CONST.PI)
        tmp -= 2 * CONST.PI;

    return tmp;
}

ComputeMagDevFromTrueHeadAndMagVarAndCompHead.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.Angle180Default;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Magnetic Variation when True Heading,  Magnetic Deviation, and
///  Compass Heading are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeMagVarFromTrueHeadAndMagDevAndCompHead(magVarOut, trueHeadInput, magDevInput, compHeadInput) {
    Equation.call(this, magVarOut, trueHeadInput, magDevInput, compHeadInput);
}
// ComputeMagVarFromTrueHeadAndMagDevAndCompHead is a subclass of Equation:
ComputeMagVarFromTrueHeadAndMagDevAndCompHead.inheritsFrom(Equation);

// compute magnetic variation
// assumes that inputs have value.
ComputeMagVarFromTrueHeadAndMagDevAndCompHead.prototype.compute = function () {
    var tmp = (this.input3() - this.input2() - this.input1());
    normalizeAngle(tmp);
    if (tmp > CONST.PI)
        tmp -= 2 * CONST.PI;

    return tmp;
}

ComputeMagVarFromTrueHeadAndMagDevAndCompHead.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.Angle180Default;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Compass Heading when True Heading, Magnetic Variation, and
///  Magnetic Deviation are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeCompHeadFromTrueHeadAndMagVarAndMagDev(compHeadOut, trueHeadInput, magVarInput, magDevInput) {
    Equation.call(this, compHeadOut, trueHeadInput, magVarInput, magDevInput);
}
// ComputeCompHeadFromTrueHeadAndMagVarAndMagDev is a subclass of Equation:
ComputeCompHeadFromTrueHeadAndMagVarAndMagDev.inheritsFrom(Equation);

// compute Compass Heading
// assumes that inputs have value.
ComputeCompHeadFromTrueHeadAndMagVarAndMagDev.prototype.compute = function () {
    return normalizeAngle(this.input1() + this.input2() + this.input3());
}

ComputeCompHeadFromTrueHeadAndMagVarAndMagDev.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Magnetic Heading when True Heading & Magnetic Variation are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeMagHeadFromTrueHeadAndMagVar(magHeadOut, trueHeadInput, magVarInput) {
    Equation.call(this, magHeadOut, trueHeadInput, magVarInput);
}
// ComputeMagHeadFromTrueHeadAndMagVar is a subclass of Equation:
ComputeMagHeadFromTrueHeadAndMagVar.inheritsFrom(Equation);

// compute Compass Heading
// assumes that inputs have value.
ComputeMagHeadFromTrueHeadAndMagVar.prototype.compute = function () {

    return normalizeAngle(this.input1() + this.input2());
}

ComputeMagHeadFromTrueHeadAndMagVar.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}
