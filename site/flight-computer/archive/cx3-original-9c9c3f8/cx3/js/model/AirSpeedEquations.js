/*
   CX-3 - Flight Calculator
   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
 */

/**
 * @file
 * Equations used for calcuating various airspeed values
 */

////////////////////////////////////////////////////////////////////////////////
///  
///  Base class for the airspeed equations.  Contains some common formulas.
///
////////////////////////////////////////////////////////////////////////////////
var AirspeedEquation = {
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute speed of sound at a given temperature
    ///        using CS_0 speed of sound at 0 m (std temp at 0 M = 15 C)
    ///
    ///  @param [in] <trueTemp> <double - in units of kelvin (K)>
    ///
    ///  @return <double - computed value of speed of sound (cs)>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_sound_speed: function (trueTemp) {
        return Math.sqrt(CONST.Gamma * CONST.R / CONST.M) * Math.sqrt(trueTemp);
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute per unit pitot pressure rise dp from Calibrated Air Speed
    ///        using CS_0 speed of sound at 0 m (std temp at 0 M = 15 C)
    ///
    ///     dp = StdPressure_mb*{[1 + 0.2*(CAS/CS_0)^2]^3.5 - 1}
    ///
    ///  @param [in] <calAirSpeed> <double - in units of meters/second (M/S)>
    ///
    ///  @return <double - computed per unit pitot pressure rise dp>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_dp_from_CAS: function (calAirSpeed) {
        var dp;
        var val;

        dp = calAirSpeed / CONST.CS_0;       //intermediate value
        dp = dp * dp;
        val = Math.pow((1 + 0.2 * dp), 3.5); //intermediate value
        dp = CONST.StdPressure_mb * (val - 1);

        return dp;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute temperature ratio (IAT v OAT) given Mach & recovery factor (default =1)
    ///
    ///  @param [in] <mach> <double - no unit>
    ///  @param [in] <recovery> <double - no unit>
    ///
    ///  @return <double - computed value of temp ratio>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_temp_ratio_m: function (mach, recovery) {
        recovery = (typeof recovery !== "undefined") ? recovery : 1.0;
        return 0.2 * recovery * mach * mach + 1;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute temperature ratio (IAT v OAT) given true air speed & recovery factor (default =1)
    ///
    ///  @param [in] <trueAirSpd> <in units of meters/second (M/S)>
    ///  @param [in] <recovery> <no unit>
    ///
    ///  @return <computed value of speed of sound (cs)>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_temp_ratio_s: function (trueAirSpd, recovery) {
        recovery = (typeof recovery !== "undefined") ? recovery : 1.0;
        return 0.2 / (CONST.Gamma * CONST.R / CONST.M) * recovery * trueAirSpd * trueAirSpd;
    },
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///      compute an intermediate value that is used in a couple of the 
    ///      airspeed equations
    ///
    ///  @param [in] <presAlt> <in units of meters (m)>
    ///
    ///  @return <computed value of h>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_p: function (presAlt) {
        return CONST.StdPressure_mb * Math.pow((1 - (presAlt / CONST.Tstd_div_L)), CONST.gMRL);
    }
};


////////////////////////////////////////////////////////////////////////////////
///  
///  Computes MACH ratio when True Airspeed and Outside Air Temperature are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeMachFromTASAndTrueTemp(MachOutput, TASIn, tempInput) {
    Equation.call(this, MachOutput, TASIn, tempInput);
}

// ComputeMachFromTASAndTrueTemp is a subclass of Equation:
ComputeMachFromTASAndTrueTemp.inheritsFrom(Equation);

// compute MACH ratio
// assumes that inputs have value.
ComputeMachFromTASAndTrueTemp.prototype.compute = function () {
    return (this.input1() / AirspeedEquation.compute_sound_speed(this.input2()));
}

ComputeMachFromTASAndTrueTemp.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.MachDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Outside Air Temperature when MACH and Indicated Air Temperature are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTrueTempFromIndTempAndMach(tempOutput, IndTempIn, MachInput, CalInput) {
    Equation.call(this, tempOutput, IndTempIn, MachInput, CalInput);
}

// ComputeTrueTempFromIndTempAndMach is a subclass of Equation:
ComputeTrueTempFromIndTempAndMach.inheritsFrom(Equation);

// compute Outside Air Temperature
// assumes that inputs have value.
ComputeTrueTempFromIndTempAndMach.prototype.compute = function () {
    return this.input1() / AirspeedEquation.compute_temp_ratio_m(this.input2(), this.input3());
}

ComputeTrueTempFromIndTempAndMach.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Indicated Air Temperature when MACH and Outside Air Temperature are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeIndTempFromTrueTempAndMach(indTempOutput, tempIn, MachInput, CalInput) {
    Equation.call(this, indTempOutput, tempIn, MachInput, CalInput);
}

// ComputeIndTempFromTrueTempAndMach is a subclass of Equation:
ComputeIndTempFromTrueTempAndMach.inheritsFrom(Equation);

// compute Outside Air Temperature
// assumes that inputs have value.
ComputeIndTempFromTrueTempAndMach.prototype.compute = function () {
    return this.input1() * AirspeedEquation.compute_temp_ratio_m(this.input2(), this.input3());
}

ComputeIndTempFromTrueTempAndMach.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Outside Air Temperature when True Air Speed 
//  and Indicated Air Temperature are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTrueTempFromIndTempAndTAS(tempOutput, IndTempIn, TASInput, CalInput) {
    Equation.call(this, tempOutput, IndTempIn, TASInput, CalInput);
}

// ComputeTrueTempFromIndTempAndTAS is a subclass of Equation:
ComputeTrueTempFromIndTempAndTAS.inheritsFrom(Equation);

// compute Outside Air Temperature
// assumes that inputs have value.
ComputeTrueTempFromIndTempAndTAS.prototype.compute = function () {
    return this.input1() - AirspeedEquation.compute_temp_ratio_s(this.input2(), this.input3());
}

ComputeTrueTempFromIndTempAndTAS.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Indicated Air Temperature when True Air Speed 
/// and Outside Air Temperature are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeIndTempFromTrueTempAndTAS(indTempOutput, tempIn, TASInput, CalInput) {
    Equation.call(this, indTempOutput, tempIn, TASInput, CalInput)
}

// ComputeIndTempFromTrueTempAndTAS is a subclass of Equation:
ComputeIndTempFromTrueTempAndTAS.inheritsFrom(Equation);

// compute Outside Air Temperature
// assumes that inputs have value.
ComputeIndTempFromTrueTempAndTAS.prototype.compute = function () {
    return this.input1() + AirspeedEquation.compute_temp_ratio_s(this.input2(), this.input3());
}

ComputeIndTempFromTrueTempAndTAS.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes MACH ratio when Calibrated Airspeed and Pressure Altitude are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeMachFromCASAndPAlt(MachOutput, CASIn, PAltInput) {
    Equation.call(this, MachOutput, CASIn, PAltInput);
}

// ComputeMachFromCASAndPAlt is a subclass of Equation:
ComputeMachFromCASAndPAlt.inheritsFrom(Equation);

// compute MACH ratio
// assumes that inputs have value.
ComputeMachFromCASAndPAlt.prototype.compute = function () {
    console.log(this.input1());
    var dp = AirspeedEquation.compute_dp_from_CAS(this.input1());
    var p = AirspeedEquation.compute_p(this.input2());

    var val = dp / p;    //intermediate calculation
    dp = Math.pow((val + 1), (2.0 / 7.0));  //intermediate calculation
    p = 5 * (dp - 1);
    val = Math.sqrt(p);

    return val;
    //return sqrt(5*(pow((dp/p+1), 2/7)-1));
}

ComputeMachFromCASAndPAlt.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.MachDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes True Airspeed when Outside Air Temperature and MACH are known
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTASFromTrueTempAndMach(TASOutput, tempInput, MachInput) {
    Equation.call(this, TASOutput, tempInput, MachInput);
}

// ComputeTASFromTrueTempAndMach is a subclass of Equation:
ComputeTASFromTrueTempAndMach.inheritsFrom(Equation);

// compute MACH ratio
// assumes that inputs have value.
ComputeTASFromTrueTempAndMach.prototype.compute = function () {
    return this.input2() * AirspeedEquation.compute_sound_speed(this.input1());
}

ComputeTASFromTrueTempAndMach.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes Calibrated Airspeed when MACH ratio and Pressure Altitude are known
///
///     x = (1 - PAlt/Tstd_div_L)^gMRL
///    ias=661.4786*(5*((1 + x*((1 + M^2/5)^3.5 - 1))^(2/7.) - 1))^0.5;
///
///    CAS = CS_0*(5*((1 + x*((1 + (Mach^2)/5)^3.5 - 1))^(2/7) - 1)^0.5
///
///  TODO: add description to CX3Equations document
///  derived from aviation formulatory v1.46 & CX-2 equations
///
////////////////////////////////////////////////////////////////////////////////
function ComputeCASFromPAltAndMach(CASOutput, PAltInput, MachInput) {
    Equation.call(this, CASOutput, PAltInput, MachInput);
}

// ComputeCASFromPAltAndMach is a subclass of Equation:
ComputeCASFromPAltAndMach.inheritsFrom(Equation);

// compute Calibrated Airspeed
// assumes that inputs have value.
ComputeCASFromPAltAndMach.prototype.compute = function () {
    var x = Math.pow((1 - (this.input1() / CONST.Tstd_div_L)), CONST.gMRL);

    var y = 1 + this.input2() * this.input2() / 5;  //intermediate calculations
    var val = Math.pow(y, 3.5) - 1.0;
    y = 1 + x * val;
    val = Math.pow(y, (2.0 / 7.0));
    y = 5 * (val - 1);
    val = CONST.CS_0 * Math.sqrt(y);

    return val;
}

ComputeCASFromPAltAndMach.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AirSpeedDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///  Computes the Pressure Altitude from pressure altitude (dummy to catch unit changes)
///  are known.
///
////////////////////////////////////////////////////////////////////////////////
function ComputePressAltFromPressAlt(pressureAltOutput, presAltInput) {
    Equation.call(this, pressureAltOutput, presAltInput);
}

// ComputePressAltFromPressAlt is a subclass of Equation:
ComputePressAltFromPressAlt.inheritsFrom(Equation);

// compute Pressure Altitude
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputePressAltFromPressAlt.prototype.compute = function () {
    return this.input1();
}

ComputePressAltFromPressAlt.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}

