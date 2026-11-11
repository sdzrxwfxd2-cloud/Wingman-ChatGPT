/*
   CX-3 - Flight Calculator
   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
 */

/**
 * @file
 * Generic linear Equations which can be subclassed.
 */

function LinEqComputeMfromYandX(_mOutput, _yInput, _xInput) {
    Equation.call(this, _mOutput, _yInput, _xInput);
}
LinEqComputeMfromYandX.inheritsFrom(Equation);

// compute m = y/x
// assumes that inputs have value.
LinEqComputeMfromYandX.prototype.compute = function () {
    return this.input1() / this.input2();
}



function LinEqComputeYfromMandX(_yOutput, _mInput, _xInput) {
    Equation.call(this, _yOutput, _mInput, _xInput)
}
LinEqComputeYfromMandX.inheritsFrom(Equation);

// compute y = m _ x
// assumes that inputs have value.
LinEqComputeYfromMandX.prototype.compute = function () {
    return this.input1() * this.input2();
}



function LinEqComputeXfromYandM(_xOutput, _yInput, _mInput) {
    Equation.call(this, _xOutput, _yInput, _mInput)
}
LinEqComputeXfromYandM.inheritsFrom(Equation);

// compute x = y / m
// assumes that inputs have value.
LinEqComputeXfromYandM.prototype.compute = function () {
    return this.input1() / this.input2();
}

