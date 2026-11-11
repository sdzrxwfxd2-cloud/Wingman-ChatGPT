///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 733 $
// @date    $Date: 2012-03-08 10:04:18 -0800 (Thu, 08 Mar 2012) $
// @brief   Equations used for calcuating various altitude values
//
// NOTE that Equation instances must not have mutable state for this to work
// (they get constructed once, globally)!
//
//#ifndef __INCLUDED_ALTITUDE_EQUATIONS_H
//#define __INCLUDED_ALTITUDE_EQUATIONS_H
//
//#include "calculator.h"
//#include "CX3Equations.h"
//#include "variables.h"
//#include "equations.h"
//#include "math.h"


////////////////////////////////////////////////////////////////////////////////
///  
///	Base class for the altitude equations.  Contains some common formulas.
///
////////////////////////////////////////////////////////////////////////////////
var AltitudeEquation = {
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief
    ///       compute an intermediate value that is used in a couple of the 
    ///			altitude equations
    ///
    ///  @param [in] <barPressure> <double -in units of millibar (mb)>
    ///
    ///  @return <double - computed value of h>
    ///
    ////////////////////////////////////////////////////////////////////////////////
    compute_h: function (barPressure) {
        return CONST.Tstd_div_L * (1 - (Math.pow((barPressure / CONST.StdPressure_mb), CONST.inv_gMRL)));
    }
};


////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Indicated Altitude when barometric pressure and Pressure
///	altitude are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeIaltFromBarPresAndPalt(altOutput, barPressureInput, pressureAltInput) {
    Equation.call(this, altOutput, barPressureInput, pressureAltInput);
}
// ComputeIaltFromBarPresAndPalt is a subclass of Equation:
ComputeIaltFromBarPresAndPalt.inheritsFrom(Equation);

// compute Indicated Altitude
// assumes that inputs have value.
ComputeIaltFromBarPresAndPalt.prototype.compute = function () {
    return (this.input2() - AltitudeEquation.compute_h(this.input1()));
}

ComputeIaltFromBarPresAndPalt.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Barometric Pressure when Indicated Altitude and Pressure
///	altitude are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeBarPresFromIaltAndPalt(barPressOutput, indicatedAltInput, pressureAltInput) {
    Equation.call(this, barPressOutput, indicatedAltInput, pressureAltInput);
}
// ComputeBarPresFromIaltAndPalt is a subclass of Equation:
ComputeBarPresFromIaltAndPalt.inheritsFrom(Equation);

// compute Barometric pressure
// assumes that inputs have value.
ComputeBarPresFromIaltAndPalt.prototype.compute = function () {
    return (CONST.StdPressure_mb * (Math.pow((1 - ((this.input2() - this.input1()) / CONST.Tstd_div_L)), CONST.gMRL)));
}

ComputeBarPresFromIaltAndPalt.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.PressureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Pressure Altitude when Barometric Pressure and Indicated 
///	Altitude are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputePAltFromIaltAndBarPressure(pressureAltOutput, indicatedAltInput, barPressureInput) {
    Equation.call(this, pressureAltOutput, indicatedAltInput, barPressureInput);
}
// ComputePAltFromIaltAndBarPressure is a subclass of Equation:
ComputePAltFromIaltAndBarPressure.inheritsFrom(Equation);

// compute Pressure Altitude
// assumes that inputs have value.
ComputePAltFromIaltAndBarPressure.prototype.compute = function () {
    return (this.input1() + AltitudeEquation.compute_h(this.input2()));
}

ComputePAltFromIaltAndBarPressure.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Density Altitude when Pressure Altiture and Temperature 
///	are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeDensAltFromPAltAndTemp(densAltOutput, pressureAltInput, tempInput) {
    Equation.call(this, densAltOutput, pressureAltInput, tempInput);
}
// ComputeDensAltFromPAltAndTemp is a subclass of Equation:
ComputeDensAltFromPAltAndTemp.inheritsFrom(Equation);

// compute Density Altitude
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputeDensAltFromPAltAndTemp.prototype.compute = function () {
    /* This is an alternate method to calculate Temp .  It's simpler but I couldn't
     * rebalance it for Palt and I wanted to use the same equation for all the density
     * altitude calculations.
     * var adjT = compute_adjustedTstd(input1());
     * return (input1() + ((adjT / L) * ( 1 - pow((adjT/input2()), (1/(gMRL-1))))));
     */
    var tmp = (CONST.Tstd_atm / this.input2()) * (Math.pow((1 - ((CONST.L * this.input1()) / CONST.Tstd_atm)), CONST.gMRL));
    return ((CONST.Tstd_atm / CONST.L) * (1 - Math.pow(tmp, (1 / (CONST.gMRL - 1)))));
}

ComputeDensAltFromPAltAndTemp.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Pressure Altitude when Density Altiture and Temperature 
///	are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputePressAltFromDensAltAndTemp(pressureAltOutput, DensAltInput, tempInput) {
    Equation.call(this, pressureAltOutput, DensAltInput, tempInput);
}
// ComputePressAltFromDensAltAndTemp is a subclass of Equation:
ComputePressAltFromDensAltAndTemp.inheritsFrom(Equation);

// compute Pressure Altitude
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputePressAltFromDensAltAndTemp.prototype.compute = function()
{
    var tmp = (this.input2() / CONST.Tstd_atm) * Math.pow((1 - ((this.input1() * CONST.L) / CONST.Tstd_atm)), (CONST.gMRL - 1));
    return ((CONST.Tstd_atm / CONST.L) - ((CONST.Tstd_atm / CONST.L) * Math.pow(tmp, CONST.inv_gMRL)));
}

ComputePressAltFromDensAltAndTemp.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(true);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.AltitudeDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}



////////////////////////////////////////////////////////////////////////////////
///  
///	Computes the Temperature when Density Altiture and Pressure Altitude 
///	are known.
///
///	See the CX3Equations document for a dscription of this calculation, it is
///	derived from the US Standard Atmosphere, 1976.
///
////////////////////////////////////////////////////////////////////////////////
function ComputeTempFromDensAltAndPressAlt(TempOutput, DensAltInput, PressAltInput) {
    Equation.call(this, TempOutput, DensAltInput, PressAltInput);
}
// ComputeTempFromDensAltAndPressAlt is a subclass of Equation:
ComputeTempFromDensAltAndPressAlt.inheritsFrom(Equation);

// compute temperature
// assumes that inputs have value.
// assumes that default units of variables are stored in meters and kelvin
ComputeTempFromDensAltAndPressAlt.prototype.compute = function () {
    /* This is an alternate method to calculate Temp .  It's simpler but I couldn't
     * rebalance it for Palt and I wanted to use the same equation for all the density
     * altitude calculations.
     * var adjT = compute_adjustedTstd(input2());
     * return (adjT / (pow((1 - ((L * (input1() - input2())) / adjT)), (gMRL - 1))));
     */

    var tmp = CONST.Tstd_atm * Math.pow((1 - ((CONST.L * this.input2()) / CONST.Tstd_atm)), CONST.gMRL);
    return (tmp / (Math.pow((1 - ((this.input1() * CONST.L) / CONST.Tstd_atm)), (CONST.gMRL - 1))));
}

ComputeTempFromDensAltAndPressAlt.prototype.setPreferredUnits = function () {
    this.output_.setUseDefaultUnit(false);

    if (this.preferredUnits_.ptr == null) {
        this.preferredUnits_.ptr = CONST.TemperatureDefault;
    }
    this.output_.setPreferredUnit(this.preferredUnits_);
}
