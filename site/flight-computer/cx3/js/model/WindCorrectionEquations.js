///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 790 $
// @date    $Date: 2012-04-10 16:17:20 -0700 (Tue, 10 Apr 2012) $
// @brief   Equations used for calcuating wind corrections (i.e. Wind Triangle)
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_WIND_CORRECTION_EQUATIONS_H
//#define __INCLUDED_WIND_CORRECTION_EQUATIONS_H
//
//#include "calculator.h"
//#include "CX3Equations.h"
//#include "variables.h"
//#include "equations.h"
//#include "math.h"

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Makes sure that angles are in the range 0 - 2pi
///
///  @param [in] <double - angle> <angle to normalize>
///
///  @return <double - adjusted angle>
///
////////////////////////////////////////////////////////////////////////////////
function normalizeAngle(angle) {
    var tmp = angle % (2 * CONST.PI);
    if (tmp < 0)
        tmp += 2 * CONST.PI;
    return tmp;
}

var WindCorrectionEquation = {
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Wind directions are given as "From" direction rather than "To", 
    //    we'll add 180 degrees to get our vector point in the correct direction.
    ///
    ///  @param [in] <windDir> <wind vector as entered by the user, in radians>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    windAngleCorrection: function (windDir) {
        var cor_wind = (windDir + CONST.PI);
        if (cor_wind > (2 * CONST.PI))
            cor_wind -= (2 * CONST.PI);
        return cor_wind;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    
    ///
    ///  @param [in] <> <>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    lawOfCosinesComputeSidec: function (a, b, gamma) {
        var tmp = Math.cos(gamma);
        tmp *= 2 * a * b;
        tmp = (a * a) + (b * b) - tmp;
        return Math.sqrt(tmp);
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Computes the Angle b when a, angle A, and b are known.
    ///
    ///  @param [in] <a> <length of side a>
    ///
    ///  @param [in] <A> <Angle of side A>
    ///
    ///  @param [in] <B> <length of side b>
    ///
    ///  @returns <angle opposite side B>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    lawOfSinesComputeAngle: function (a, A, b) {
        var tmp = Math.sin(A) * b;
        tmp /= a;

        // Note the use of arctan here rather than arcsin (normally used in the 
        // law of sines).  arcsin suffers from some accuracy issues near +/- CONST.PI/2
        // so we've opted to use the arctan method for calculating arcsin.
        return 2 * Math.atan2(tmp, (1 + Math.sqrt((1 - tmp * tmp))));
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Wind Correction
////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Wind speed from Ground speed, True airspeed, True course and 
///  True heading.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWSFromGndSpdAndTASAndTCAndTH(wndSpdOut, GndSpdIn, TASIn, trueCourseIn, trueHeadIn) {
    Equation.call(this, wndSpdOut, GndSpdIn, TASIn, trueCourseIn, trueHeadIn);
}
// ComputeWSFromGndSpdAndTASAndTCAndTH is a subclass of Equation:
ComputeWSFromGndSpdAndTASAndTCAndTH.inheritsFrom(Equation);

// compute True Heading
// assumes that inputs have value.
ComputeWSFromGndSpdAndTASAndTCAndTH.prototype.compute = function () {
    return WindCorrectionEquation.lawOfCosinesComputeSidec(this.input1(), this.input2(), (this.input4() - this.input3()));
}

ComputeWSFromGndSpdAndTASAndTCAndTH.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Computes True airspeed from Ground speed, Wind speed, Wind direction and
///  True course.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC(TASOut, GndSpdIn, wndSpdIn, wndDirIn, trueCourseIn) {
    Equation.call(this, TASOut, GndSpdIn, wndSpdIn, wndDirIn, trueCourseIn);
}
// ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC is a subclass of Equation:
ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC.inheritsFrom(Equation);

// compute True Heading
// assumes that inputs have value.
ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC.prototype.compute = function () {
    var corWind = WindCorrectionEquation.windAngleCorrection(this.input3());
    return WindCorrectionEquation.lawOfCosinesComputeSidec(this.input1(), this.input2(), (this.input4() - corWind));
}

ComputeTASFromGndSpdAndWndSpdAndWindDirAndTC.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Computes ground speed from true air speed, wind speed, wind direction, and
//  true heading.
////////////////////////////////////////////////////////////////////////////////
function ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH(gndSpdOut, TASIn, wndSpdIn, wndDirIn, trueHeadIn) {
    Equation.call(this, gndSpdOut, TASIn, wndSpdIn, wndDirIn, trueHeadIn);
}
// ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH is a subclass of Equation:
ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH.inheritsFrom(Equation);

// compute Ground Speed
// assumes that inputs have value.
ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH.prototype.compute = function () {
    return WindCorrectionEquation.lawOfCosinesComputeSidec(this.input1(), this.input2(), (this.input4() - this.input3()));
}

ComputeGndSpdFromTASAndWndSpdAndWindDirAndTH.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.GroundSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates True heading from true course, wind direction, wind speed, and
/// true airspeed.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTHFromTCAndWndDirAndWndSpeedAndTAS(trueHeadOut, trueCourseIn, windDirIn, windSpeedIn, TASIn) {
    Equation.call(this, trueHeadOut, trueCourseIn, windDirIn, windSpeedIn, TASIn);
}
// ComputeTHFromTCAndWndDirAndWndSpeedAndTAS is a subclass of Equation:
ComputeTHFromTCAndWndDirAndWndSpeedAndTAS.inheritsFrom(Equation);

// compute True Heading
// assumes that inputs have value.
ComputeTHFromTCAndWndDirAndWndSpeedAndTAS.prototype.compute = function () {
    var tmp;

    // is this an obtuse triangle?  If so, we may not be able to solve, but we
    // can try.  
    // Not sure this is a valid test for that...
    if (this.input3() > Math.sqrt(2.0) * this.input4()) {
        tmp = WindCorrectionEquation.lawOfSinesComputeAngle(this.input4(), this.input1() - this.input2(), this.input3());
        if (Calculator.hasNoValue(tmp)) {
            // oh, well we tried.
            this.calculationError_ = true;
            return tmp;
        }
        tmp += CONST.PI;
    }
    else {
        tmp = WindCorrectionEquation.lawOfSinesComputeAngle(this.input4(), this.input2() - this.input1(), this.input3());
    }
    tmp += this.input1();

    return normalizeAngle(tmp);
}

ComputeTHFromTCAndWndDirAndWndSpeedAndTAS.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates True course from true heading, wind direction, wind speed, and
/// ground speed.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTCFromTHAndWndDirAndWndSpeedAndGS(trueCourseOut, trueHeadIn, windDirIn, windSpeedIn, groundSpeedIn) {
    Equation.call(this, trueCourseOut, trueHeadIn, windDirIn, windSpeedIn, groundSpeedIn);
}
// ComputeTCFromTHAndWndDirAndWndSpeedAndGS is a subclass of Equation:
ComputeTCFromTHAndWndDirAndWndSpeedAndGS.inheritsFrom(Equation);

// compute True course
// assumes that inputs have value.
ComputeTCFromTHAndWndDirAndWndSpeedAndGS.prototype.compute = function () {
    var tmp;

    // Do we have an obtuse triangle?  Not sure this is a valid test for that...
    if (this.input3() > Math.sqrt(2.0) * this.input4()) {
        tmp = WindCorrectionEquation.lawOfSinesComputeAngle(this.input4(), this.input1() - this.input2(), this.input3());
        if (Calculator.hasNoValue(tmp)) {
            // oh, well we tried.
            this.calculationError_ = true;
            return tmp;
        }
        tmp += CONST.PI;
    }
    else {
        tmp = WindCorrectionEquation.lawOfSinesComputeAngle(this.input4(), this.input2() - this.input1(), this.input3());
    }
    tmp = this.input1() - tmp;
    return normalizeAngle(tmp);
}

ComputeTCFromTHAndWndDirAndWndSpeedAndGS.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
/// Compute the Wind direction from true course, true air speed, true heading,
///  and ground speed.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWDirFromTCAndTASAndTHAndGndSpd(windDirOut, trueCourseIn, TASIn, trueHeadIn, groundSpeedIn) {
    Equation.call(this, windDirOut, trueCourseIn, TASIn, trueHeadIn, groundSpeedIn);
}
// ComputeWDirFromTCAndTASAndTHAndGndSpd is a subclass of Equation:
ComputeWDirFromTCAndTASAndTHAndGndSpd.inheritsFrom(Equation);

// compute Wind direction
// assumes that inputs have value.
ComputeWDirFromTCAndTASAndTHAndGndSpd.prototype.compute = function () {
    var x = (this.input2() * Math.cos(this.input3() - this.input1())) - this.input4();
    var y = this.input2() * Math.sin(this.input3() - this.input1());
    return normalizeAngle(this.input1() + Math.atan2(y, x));
}

ComputeWDirFromTCAndTASAndTHAndGndSpd.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates the wind correction angle.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeWCAFromTHAndTC(wcaOut, trueHeadIn, trueCourseOut) {
    Equation.call(this, wcaOut, trueHeadIn, trueCourseOut);
}
// ComputeWCAFromTHAndTC is a subclass of Equation:
ComputeWCAFromTHAndTC.inheritsFrom(Equation);

// compute True course
// assumes that inputs have value.
ComputeWCAFromTHAndTC.prototype.compute = function () {
    var tmp = this.input1() - this.input2();
    if (tmp > CONST.PI)
        tmp = 2 * CONST.PI - tmp;
    else if (tmp < -CONST.PI)
        tmp = -2 * CONST.PI - tmp;

    // adjust sign
    var testNormalizedInput1 = normalizeAngle(this.input1() + tmp);
    var roundedNormalizedInput1 = Math.round((normalizeAngle(this.input1() + tmp) + Number.EPSILON) * 100000000) / 100000000
    if (roundedNormalizedInput1 == this.input2())
        tmp = - tmp;

    return tmp;
}

ComputeWCAFromTHAndTC.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.Angle180Default;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Wind Component
////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates Cross Wind from Wind Speed and Direction, and Runway.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeXWindFromWndSpdAndWindDirAndRunWay(XWindOut, wndSpdIn, wndDirIn, runWayIn) {
    Equation.call(this, XWindOut, wndSpdIn, wndDirIn, runWayIn);
}
// ComputeXWindFromWndSpdAndWindDirAndRunWay is a subclass of Equation:
ComputeXWindFromWndSpdAndWindDirAndRunWay.inheritsFrom(Equation);

// compute Cross Wind
// assumes that inputs have value.
ComputeXWindFromWndSpdAndWindDirAndRunWay.prototype.compute = function () {
    var tmp = this.input1() * Math.sin(this.input2() - this.input3());

    return tmp;
}

ComputeXWindFromWndSpdAndWindDirAndRunWay.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates Head Wind from Wind Speed and Direction, and Runway.
///    NOTE: negative sign indicates a tail wind
///    NOTE: positive sign indicates a head wind
///
////////////////////////////////////////////////////////////////////////////////
function ComputeHWindFromWndSpdAndWindDirAndRunWay(HWindOut, wndSpdIn, wndDirIn, runWayIn) {
    Equation.call(this, HWindOut, wndSpdIn, wndDirIn, runWayIn);
}
// ComputeHWindFromWndSpdAndWindDirAndRunWay is a subclass of Equation:
ComputeHWindFromWndSpdAndWindDirAndRunWay.inheritsFrom(Equation);

// compute Head Wind
// assumes that inputs have value.
ComputeHWindFromWndSpdAndWindDirAndRunWay.prototype.compute = function () {
    var tmp = this.input1() * Math.cos(this.input2() - this.input3());

    return tmp;
}

ComputeHWindFromWndSpdAndWindDirAndRunWay.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for air speed ALSO checks head/cross winds to
///    catch unit changes
///
///    default unit: CONST.AirSpeedDefault
///
////////////////////////////////////////////////////////////////////////////////
function ComputeSpeedFromSpeedCheckHwindXwind(speedOutput, speedInput, HWindInput, XWindInput) {
    Equation.call(this, speedOutput, speedInput, HWindInput, XWindInput);
}
// ComputeSpeedFromSpeedCheckHwindXwind is a subclass of Equation:
ComputeSpeedFromSpeedCheckHwindXwind.inheritsFrom(Equation);

// implementation: can compute - ONLY check speedInput (others look for unit changes only)
ComputeSpeedFromSpeedCheckHwindXwind.prototype.canCompute = function () {
    if (this.inputs_[0].hasValue())
        return true;

    return false;
}

// compute angle
// assumes that inputs have value.
ComputeSpeedFromSpeedCheckHwindXwind.prototype.compute = function () {
    return this.input1();
}

ComputeSpeedFromSpeedCheckHwindXwind.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// To/From
////////////////////////////////////////////////////////////////////////////////
///  
///  Calculates opposite course heading (OUT = IN-180) normalized to 0 to 360 degrees
///
////////////////////////////////////////////////////////////////////////////////
function ComputeOppositeCourse(angleOut, angleIn) {
    Equation.call(this, angleOut, angleIn);
}
// ComputeOppositeCourse is a subclass of Equation:
ComputeOppositeCourse.inheritsFrom(Equation);

// compute TO: course
// assumes that inputs have value.
ComputeOppositeCourse.prototype.compute = function () {
    var tmp = this.input1() - CONST.PI;

    return normalizeAngle(tmp);
}

ComputeOppositeCourse.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Holding Pattern
////////////////////////////////////////////////////////////////////////////////
///  
///  Compute Holding Pattern Entry Type
///
////////////////////////////////////////////////////////////////////////////////
function ComputeEntryPattern(patternOut, turnIn, headIn, holdRadicalIn) {
    Equation.call(this, patternOut, turnIn, headIn, holdRadicalIn);
}
// ComputeEntryPattern is a subclass of Equation:
ComputeEntryPattern.inheritsFrom(Equation);

// compute entry type
// assumes that inputs have value.
ComputeEntryPattern.prototype.compute = function () {
    var tmp = normalizeAngle(this.input3() - this.input2());
    var currentUnits = this.preferredUnits_.ptr;

    // holding pattern uses right turns (default)
    if (this.inputs_[0].myPreferredUnit() == turn_right) {
        if ((tmp >= 70 * CONST.PI / 180) && (tmp <= 250 * CONST.PI / 180))
            this.preferredUnits_.ptr = entry_direct;
        else if (tmp > 250 * CONST.PI / 180)
            this.preferredUnits_.ptr = entry_parallel;
        else
            this.preferredUnits_.ptr = entry_teardrop;
    }
    // holding pattern uses left turns
    else {
        if ((tmp >= 110 * CONST.PI / 180) && (tmp <= 290 * CONST.PI / 180))
            this.preferredUnits_.ptr = entry_direct;
        else if (tmp < 110 * CONST.PI / 180)
            this.preferredUnits_.ptr = entry_parallel;
        else
            this.preferredUnits_.ptr = entry_teardrop;
    }

    // check for change in units
    if (currentUnits != this.preferredUnits_.ptr) {
        this.output_.setPreferredUnit(this.preferredUnits_);
        this.output_.changed();
    }

    return tmp * 180 / CONST.PI;
}

ComputeEntryPattern.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = entry_noText;
    this.output_.setPreferredUnit(this.preferredUnits_);
}




////////////////////////////////////////////////////////////////////////////////
///  
///  Sets Turn Direction - Turn direction is a 'selectable' variable,
///  Selecting the variable sets it value to 1, all other selectable variables
/// of the same type are then set to zero
///
///  
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTurnDirection(turnOut, turnIn) {
    Equation.call(this, turnOut, turnIn);
}
// ComputeTurnDirection is a subclass of Equation:
ComputeTurnDirection.inheritsFrom(Equation);

// compute turn direction
// assumes that inputs have value.
ComputeTurnDirection.prototype.compute = function () {
    var tmp;

    if (this.input1() != 0)
        tmp = 0;
    else
        tmp = 1;

    return this.input1();
}

ComputeTurnDirection.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = turn_right;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


////////////////////////////////////////////////////////////////////////////////
///  
///  Dummy to set prefered units for Heading
///    (currently no equations to set Heading from other variables
///
////////////////////////////////////////////////////////////////////////////////
function ComputeHeadingfromHeading(headOut, headIn) {
    Equation.call(this, headOut, headIn);
}
// ComputeHeadingfromHeading is a subclass of Equation:
ComputeHeadingfromHeading.inheritsFrom(Equation);

// compute heading
// assumes that inputs have value.
ComputeHeadingfromHeading.prototype.compute = function () {
    //TODO: normalize??
    var tmp = this.input1();
    normalizeAngle(tmp);

    return this.input1();

}

ComputeHeadingfromHeading.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null)
        this.preferredUnits_.ptr = CONST.AngleDefault;
    this.output_.setPreferredUnit(this.preferredUnits_);
}


