///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//
//
//  Class Name: EquationScreen
//
//   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//
//  Notes:
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///* Insight Auto-Generated  -Start Auto Includes- */
//#include "prism_includes.h"
//#include "CX3_UI_res.h"
//#include "equationScreen.h"
///* Insight Auto-Generated -End Auto Includes- */
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include "equationScreenDefinition.h"
//#include "CX3Equations.h"
//#include "definedVariables.h"
//#include "definedUnits.h"
//#include "defaultUnits.h"
//#include <string.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif
//
//using namespace Equations;
//using namespace CX3Equations;
//using namespace Units;
//
//namespace CX3_UI
//{

/*
#define DEFUALT_TITLE_SIZE  20
*/

var ItemField = new Array(CONST.MAX_ITEMS);
for (var i = 0; i < CONST.MAX_ITEMS; i++) {
    ItemField[i] = 0;
}
var RhumbItemsActive = 0;
var RhumbItemActiveMax = 0;
var RhumbItemActiveMin = 0;
var RhumbItemField = new Array(CONST.MAX_RHUMB_ITEMS);
for (var i = 0; i < CONST.MAX_RHUMB_ITEMS; i++) {
    RhumbItemField[i] = 0;
}

// EquationScreenDefinition:
function EquationScreenDefinition(_title, _equations) {
    this.title_ = _title;
    this.equations_ = _equations;
}

EquationScreenDefinition.prototype.title = function () {
    return this.title_;
}

EquationScreenDefinition.prototype.equations = function () {
    return this.equations_;
}



/// @brief
/// Definitions for all the equation screens available to the user.
var altitideScreen = new EquationScreenDefinition(
    'Altitude',
    CONST.altitudeEqus,
);
var cloudBaseScreen = new EquationScreenDefinition(
    'Cloud Base',
    CONST.cloudBaseEqus,
);
var stdAtmosphereScreen = new EquationScreenDefinition(
    'Standard Atmosphere',
    CONST.stdAtmosphereEqus,
);
var airspeedScreen = new EquationScreenDefinition(
    'Airspeed',
    CONST.airspeedEqus,
);
var fuelScreen = new EquationScreenDefinition('Fuel', CONST.fuelEqus);
var groundSpeedScreen = new EquationScreenDefinition(
    'Ground Speed',
    CONST.groundspeedEqus,
);
var glideScreen = new EquationScreenDefinition('Glide', CONST.glideEqus);
var descentScreen = new EquationScreenDefinition(
    'Climb & Descent',
    CONST.descentEqus,
);
var windComponentScreen = new EquationScreenDefinition(
    'Wind Component',
    CONST.windComponentEqus,
);
var compassHeadingScreen = new EquationScreenDefinition(
    'Compass Heading',
    CONST.compassHeadingEqus,
);
var windCorrectionScreen = new EquationScreenDefinition(
    'Wind Correction',
    CONST.windCorrectionEqus,
);
var rhumbLineScreen = new EquationScreenDefinition(
    'Rhumb Line',
    CONST.rhumbLineEqus,
);
var weightBalanceScreen = new EquationScreenDefinition(
    'Weight and Balance',
    CONST.weightbalanceEqus,
);
var weightShiftScreen = new EquationScreenDefinition(
    'Weight Shift Formula',
    CONST.weightShiftEqus,
);
var percentMacScreen = new EquationScreenDefinition(
    '% MAC',
    CONST.percentMacEqus,
);
var estTimeArrivalScreen = new EquationScreenDefinition(
    'Estimated Time Arrival',
    CONST.estTimeArrivalEqus,
);
var toFromScreen = new EquationScreenDefinition('To - From', CONST.toFromEqus);
var holdPatternScreen = new EquationScreenDefinition(
    'Holding Pattern',
    CONST.holdingPatternEqus,
);
var convertUnitScreen = new EquationScreenDefinition(
    'Unit Conversions',
    CONST.convertUnitEqus,
);
/// Weight & Balance w/ Aircraft Profile is NOT included in equation screen list
var aircraftWtBalScreen = new EquationScreenDefinition(
    'Weight and Balance - Aircraft Profile',
    CONST.aircraftWeightBalanceEqus,
);

/// @brief
/// A list of all the equation screens that are available.  This is used to populate
/// the equation list in the UI as well as retrieve information about the variables
/// used in the equations.
CONST.equationScreens = [
    convertUnitScreen,
    altitideScreen,
    cloudBaseScreen,
    stdAtmosphereScreen,
    airspeedScreen,
    fuelScreen,
    groundSpeedScreen,
    glideScreen,
    descentScreen,
    windComponentScreen,
    estTimeArrivalScreen,
    toFromScreen,
    compassHeadingScreen,
    windCorrectionScreen,
    rhumbLineScreen,
    // weightBalanceScreen,
    // weightShiftScreen,
    // percentMacScreen,
    holdPatternScreen
];

// TESTING
CONST.equationScreensWtBal = [
    weightBalanceScreen,
    weightShiftScreen,
    percentMacScreen,
];
// TESTING

/// @brief
/// Definitions for all the Trip Planner equation screens available to the user.
var tripPlanTotalScreen = new EquationScreenDefinition("Total Trip", CONST.tripPlanTotalEqus);
var tripPlanLeg1Screen = new EquationScreenDefinition("Leg 1", CONST.tripPlanLeg1Equs);
var tripPlanLeg2Screen = new EquationScreenDefinition("Leg 2", CONST.tripPlanLeg2Equs);
var tripPlanLeg3Screen = new EquationScreenDefinition("Leg 3", CONST.tripPlanLeg3Equs);
var tripPlanLeg4Screen = new EquationScreenDefinition("Leg 4", CONST.tripPlanLeg4Equs);
var tripPlanLeg5Screen = new EquationScreenDefinition('Leg 5', CONST.tripPlanLeg5Equs);

/// @brief
/// A list of all the Trip Planner equation screens that are available.  This is used to populate
/// the equation list in the UI as well as retrieve information about the variables
/// used in the equations.
CONST.tripPlanerEquationScreens = [
    tripPlanTotalScreen,
    tripPlanLeg1Screen,
    tripPlanLeg2Screen,
    tripPlanLeg3Screen,
    tripPlanLeg4Screen,
    tripPlanLeg5Screen,
];

/// @brief
/// Definitions for all Set Default Unit equation screens
/// - used to show variable name & set new default unit for each equation's output
var setGroundSpeedUnitScreen = new EquationScreenDefinition("Ground Speed", CONST.groundspeedUnitEqus);
var setAirSpeedUnitScreen = new EquationScreenDefinition("Air Speed", CONST.airspeedUnitEqus);
var setDistanceUnitScreen = new EquationScreenDefinition("Distance", CONST.distanceUnitEqus);
var setAltitudeUnitScreen = new EquationScreenDefinition("Altitude", CONST.altitudeUnitEqus);
var setLengthUnitScreen = new EquationScreenDefinition("Length", CONST.lengthUnitEqus);
var setDurationUnitScreen = new EquationScreenDefinition("Duration", CONST.durationUnitEqus);
var setTemperatureUnitScreen = new EquationScreenDefinition("Temperature", CONST.temperatureUnitEqus);
var setPressureUnitScreen = new EquationScreenDefinition("Pressure", CONST.pressureUnitEqus);
var setFuelRateUnitScreen = new EquationScreenDefinition("Fuel Rate", CONST.fuelrateUnitEqus);
var setFuelVolumeUnitScreen = new EquationScreenDefinition("Fuel Volume", CONST.fuelvolumeUnitEqus);
var setRoCUnitScreen = new EquationScreenDefinition("Rate of Climb", CONST.ROCunitEqus);
var setAoCUnitScreen = new EquationScreenDefinition("Angle of Climb", CONST.AOCunitEqus);
var setWeightUnitScreen = new EquationScreenDefinition("Weight", CONST.weightUnitEqus);
var setTorqueUnitScreen = new EquationScreenDefinition("Torque", CONST.torqueUnitEqus);
var setPositionUnitScreen = new EquationScreenDefinition("Position", CONST.positionUnitEqus);
var setWeightRateUnitScreen = new EquationScreenDefinition("Rate (Weight/Time)", CONST.wtRateunitEqus);

/// @brief
/// A list of all the Set Default Unit screens that are available.
/// This is used to populate the name of the variable and retrieve each equation's
/// output to enable setting new default unit globally
/// NOTE: any change in order must also be applied to order units per standard in defaultUnits.h
CONST.setDefaultUnitScreens = [
    setGroundSpeedUnitScreen,
    setAirSpeedUnitScreen,
    setDistanceUnitScreen,
    setAltitudeUnitScreen,
    setLengthUnitScreen,
    setDurationUnitScreen,
    setTemperatureUnitScreen,
    setPressureUnitScreen,
    setFuelRateUnitScreen,
    setFuelVolumeUnitScreen,
    setRoCUnitScreen,
    setAoCUnitScreen,
    setWeightUnitScreen,
    setTorqueUnitScreen,
    setPositionUnitScreen,
    setWeightRateUnitScreen
];

/// @brief
/// Definition for Aircraft Profile screen - used to clear 'active' indication
/// (currently only Empty Aircraft is set active)
var aircraftProfileScreen = new EquationScreenDefinition(
    'Aircraft Profile',
    CONST.emptyAircraftEqus,
);

/*
/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
pm_event_table_entry equationScreenEvents[] = {
  { PM_EVENT_HIDE, PM_EVENT_HANDLER(&equationScreen::OnEventHide)},
  { CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED, PM_EVENT_HANDLER(&equationScreen::OnEventItemChanged)},
  { CX3_WIDGET_EVENT.EQSCREEN_ITEM_PREVIOUS, PM_EVENT_HANDLER(&equationScreen::OnEventItemPrevious)},
  { CX3_WIDGET_EVENT.EQSCREEN_ITEM_NEXT, PM_EVENT_HANDLER(&equationScreen::OnEventItemNext)},
  { CX3_WIDGET_EVENT.SET_DEFAULT_UNIT, PM_EVENT_HANDLER(&equationScreen::OnEventSetDefaultUnit)},
  { CX3_WIDGET_EVENT.ROLL_ON_ENTER, PM_EVENT_HANDLER(&equationScreen::OnEventRollOnEnter)},
  { 0, null} // array terminator
};
*/
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Builds an equationScreen.
///
///  Memory is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <size of the panel to create>
///
////////////////////////////////////////////////////////////////////////////////
function EquationScreen() {
    Panel.call(this);
    this.title = 'E6-B';
    this.fields_ = new Array(37);
    this.addEvent('cx3-keypress', Panel.EVENTS.DEFAULT_NAVIGATION);
    this.addEvent('cx3-roll-on-enter', EquationScreen.EVENTS.ROLL_ON_ENTER);
    this.addEvent(
        CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED,
        EquationScreen.prototype.OnEventItemChanged,
    );
    this.addEvent(
        CX3_WIDGET_EVENT.EQSCREEN_ITEM_PREVIOUS,
        EquationScreen.prototype.OnEventItemPrevious,
    );
    this.addEvent(
        CX3_WIDGET_EVENT.EQSCREEN_ITEM_NEXT,
        EquationScreen.prototype.OnEventItemNext,
    );
    this.addEvent(
        CX3_WIDGET_EVENT.SET_DEFAULT_UNIT,
        EquationScreen.prototype.OnEventSetDefaultUnit,
    );

    // Leave 1/2 list item height at top and bottom (smaller client area)
    // TODO: let list clients paint outside of mSize (PSF_NONCLIENT)
    //tmp.Top += (LIST_ITEM_WIDGET_HEIGHT >> 1);
    //tmp.Bottom -= (LIST_ITEM_WIDGET_HEIGHT >> 1);
    //this.varList_.mClient = tmp;

    // Create the variable container widgets and add to the list
    for (var i = 0; i < this.fields_.length; i++) {
        this.fields_[i] = new CalculatorFieldWidget();
        this.addChild(this.fields_[i]);
    }

    // set equation screen pointer to dummy screen
    this.eqScreen_ = null;

    // Initialize instrument reduction factor (TAT vs OAT)
    RecoveryFactor.setValue(1.0);
    ProfileRecoveryFactor.setValue(1.0);
    ProfileRecoveryFactor.setCopied(true);

    // initialize ShouldUseProfileForWtBalCalcs
    ShouldUseProfileForWtBalCalcs.setValue(false);

    // Initialize Weight & Balance variables
    // TODO: should this be moved to it's own routine?
    for (var i = 0; i < CONST.MAX_ITEMS; i++) {
        if (i == 0) {
            ItemUnits[0] = new Pointer(item_noText);
            CONST.ITEMS[0].setPreferredUnit(ItemUnits[0]);
            CONST.ITEMS[0].setValue(1);
        } else {
            ItemUnits[i] = new Pointer(item_add);
            CONST.ITEMS[i].setPreferredUnit(ItemUnits[i]);
            CONST.ITEMS[i].setValue(i + 1);
        }
        ItemStatus[1] = 1; //'add'

        // initialized Item 5-8 Wt/MOM 'canCompute
        Weight5.changed();
        Mom5.changed();
    }
    // use i=MAX_ITEMS to store/set Totals prefered unit
    ItemUnits[CONST.MAX_ITEMS] = new Pointer(item_noText);
    Totals.setPreferredUnit(ItemUnits[CONST.MAX_ITEMS]);
}
// EquationScreen is a subclass of Panel:
EquationScreen.inheritsFrom(Panel);

EquationScreen.EVENTS = {
    ROLL_ON_ENTER: function (_details) {
        this.activateNextChild();
    },
};
/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen::~equationScreen() {
  for (unsigned int i = 0; i < ARRAY_SIZE(this.fields_); i++) {
    Destroy(this.fields_[i]);
  }

  // takes care of the list
  Destroy(this.varList_);

  Destroy(this.title_);
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Main event handler function.  Searches our event table to see if our
///    class processes the specified event.
///
///  @param [in] <Event> <Event to be processed>
///
///  @return <whatever the matching function (or base class if there isn't one)
///        returns>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.Notify = function(const pm_event_t &Event) {
  pm_event_table_entry *pEventList = equationScreenEvents;

  while(pEventList.EventType) {
    if (pEventList.EventType == Event.Type) {
      if (pEventList.Handler == null) {
        return 0;
      }
      return PM_CALL_EVENT_HANDLER(*this, pEventList.Handler)(Event);
    }
    pEventList++;
  }

  return Pm_Panel::Notify(Event);
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Override the base class implementation to allow for background painting
///    and title underline.
///
///  @param [in] <Invalid> <region that has been marked for painting>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.Paint = function(const Pm_Region &Invalid) {
  OpenCanvas(Invalid);

  // Base class paints first 
  Pm_Panel::Paint(Invalid);

  // Paint the underline for our title bar
  // create a brush
  Pm_Brush Brush;
  Brush.LineColor = Pm_Resource_Manager::GetColor(CID_GROUP_FILL);
  Brush.FillColor = Pm_Resource_Manager::GetColor(CID_GROUP_FILL);
  Brush.Style = PBS_SOLID_FILL;
  Brush.Width = 2;

  Line(mSize.Left + 2, 
      (mSize.Top + DEFUALT_TITLE_SIZE), 
      mSize.Right - 2, 
      (mSize.Top + DEFUALT_TITLE_SIZE),
      Brush);

  PaintChildren(Invalid);
  CloseCanvas();
}
*/

////////////////////////////////////////////////////////////////////////////////
///  @brief
///      Sets the current screen definition (title, equations, variables)
///      for Trip Planner equation screens.
///
///  @param [in] <eq> <pointer to the new equation to use>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.SetTripEquation = function (eq, focus) {
    var flags = 0;
    var field = 0;

    // Make sure there is valid equation
    //assert(eq != 0);

    // if different than our current equation, then update the
    // variables on the screen
    if (eq == this.eqScreen_) {
        return;
    } else {
        this.ClearEquation();
    }

    // save the pointer
    this.eqScreen_ = eq;

    // make sure that we've allocated our memory
    //assert(this.fields_ != null);

    // Set the screen title
    //assert(this.title_ != null);
    this.subTitle = eq.title();

    // Clear the widget list
    this.clearListData();

    // iterate through all the equations on this screen, looking for
    // unique variables (check outputs only for Trip Planner).
    // insert 'Calculated Values' item between inputs and read-only outputs
    var pEq = this.eqScreen_.equations();
    var idx = 0;
    for (idx = 0; idx < pEq.length; idx++) {
        // set output's preferred units & indicate equation is active
        // NOTE: ground speed unit check equation is in 'calculated value' location in list
        // don't add output to screen (added next for trip planner GS equation)
        pEq[idx].setPreferredUnits();
        pEq[idx].setActiveState(true);

        if (field == CONST.TRIP_LEG_INPUTS) {
            // insert 'calc values' item here
            this.tripPlanPreferredUnits_ = new Pointer(item_noText);
            TripOutput.setPreferredUnit(this.tripPlanPreferredUnits_);
            this.setVariable_(TripOutput, field++, 0, 0, WIDGET_FLAG.CX3_ITEM_FLAGS);
            // set flags to indent output values
            flags = WIDGET_FLAG.CX3_INDENT_LEFT;
        } else {
            // And add the output
            //assert(this.setVariable_(&pEq[idx].getOutput(), field++,0, 0, flags) == true);
            this.setVariable_(pEq[idx].getOutput(), field++, 0, 0, flags);
        }
    }
    // re-set focus
    if (focus == true) {
        this.activeChild = this.fields_[0];
        //this.varList_.SetSelected(this.fields_[0]);
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///      Set Trip Planner leg variables as active (and copy from previous leg)
///      or inactive
///
///  @param [in] <eq> <pointer to the new equation to use>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.SetClearTripLegVariables = function (leg, active) {
    var pEq = this.tripScreens()[leg].equations();
    var idx = 0;
    var pEqLast = this.tripScreens()[leg - 1].equations();
    var idxLast = 0;
    var tempVar;
    var varLast;

    // iterate through all the INPUT equations on this screen, and
    // if (active == false)
    //    clear output variable
    //    set output variable as inactive
    // if (active == true)
    //    clear output variable
    //    set output variable as active
    //    and if (leg > 1)
    //      copy value from previous leg and set copied = true
    for (idx = 0; idx < pEq.length; idx++) {
        tempVar = pEq[idx].getOutput();

        // Only clear inputs (outputs will be cleared or set by their inputs
        if (idx < CONST.TRIP_LEG_INPUTS) {
            tempVar.clearValue();
        }
        // Set/Clear 'active' leg indication & copy inputs from previous leg
        if (active == false) {
            tempVar.setActive(false);
        } else {
            tempVar.setActive(true);

            if (leg > 1 && idx < CONST.TRIP_LEG_INPUTS) {
                if (idx < CONST.TRIP_LEG_INPUTS - 1) {
                    varLast = pEqLast[idxLast].getOutput();
                    tempVar.setValue(varLast.value());
                    tempVar.setCopied(true);
                } else {
                    // copy departure from last leg ETA (output #8)
                    idxLast += 9;
                    varLast = pEqLast[idxLast].getOutput();
                    // set value as 'calculated' from last leg ETA
                    tempVar.setValue(varLast.value(), true);
                }

                idxLast++;
            }
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Clears the current screen definition
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.ClearEquation = function () {
    if (this.eqScreen_ != null) {
        // clear equation 'active' indication
        var eqs = this.eqScreen_.equations();
        for (var i in eqs) {
            eqs[i].setActiveState(false);
        }
    }
    // set equation screen pointer to dummy screen
    this.eqScreen_ = null;
};
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Sets the current screen definition (title, equations, variables).
///
///  @param [in] <eq> <pointer to the new equation to use>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.SetEquation = function (_eq) {
    if (DEBUG) {
        console.log('EquationScreen.prototype.SetEquation');
        console.log('_eq.title()=' + _eq.title());
    }
    var varTemp;
    // Check for Weight & Balance selection with valid Aircraft Profile
    if (_eq == weightBalanceScreen && AircraftWtBal.hasValue()) {
        _eq = aircraftWtBalScreen;
    }

    // if different than our current equation, then update the
    // variables on the screen
    if (_eq == this.eqScreen_) {
        return;
    } else {
        // Added to fix active element losing focus after it has been removed:
        this.activeChild = undefined;

        this.ClearEquation();
    }

    // save the pointer
    this.eqScreen_ = _eq;

    // Set the screen title
    this.subTitle = _eq.title();

    // Clear the widget list
    this.clearListData();

    // iterate through all the equations on this screen, looking for
    // unique variables.
    var eqs = this.eqScreen_.equations();
    console.log('Es estoooo', this.eqScreen_.equations());
    // Special setups for Weight and Balance (with or without aircraft profile),
    //   Rhumb Line, and Holding Pattern
    if (_eq == weightBalanceScreen) {
        if (DEBUG) {
            console.log('setup wt bal screen (_eq == weightBalanceScreen) ');
            console.log(
                'ShouldUseProfileForWtBalCalcs.value()=' +
                ShouldUseProfileForWtBalCalcs.value(),
            );
        }
        this.setItems(0);
    } else if (_eq == rhumbLineScreen) {
        this.setRhumbItems(0);
    } else if (_eq == aircraftWtBalScreen) {
        if (DEBUG) {
            console.log('setup wt bal screen (_eq == aircraftWtBalScreen)');
            console.log(
                'ShouldUseProfileForWtBalCalcs.value()=' +
                ShouldUseProfileForWtBalCalcs.value(),
            );
        }
        // setup
        var i = 0;
        var field = 0;

        // Add item inputs
        while (i < CONST.MAX_AIRCRAFT_INPUT_ITEMS) {
            // set output's preferred units
            eqs[i].setPreferredUnits();
            // TODO:  & indicate equation is active (if change all item units)
            // NOTE: this will require some work
            //(*pEq).setActiveState(true);
            // Add output to screen
            this.setVariable_(eqs[i].getOutput(), field++, 0, i++, 0);
        }

        // Add 'total' item & RF
        AircraftRF.setReadOnly(true); // RF is read-only in this screen
        this.setVariable_(Totals, field++, 0, i++, WIDGET_FLAG.CX3_ITEM_FLAGS);
        this.setVariable_(
            AircraftRF,
            field++,
            0,
            i++,
            WIDGET_FLAG.CX3_GROUP_VAR_FLAGS,
        );

        // Add output items
        while (
            i <
            CONST.MAX_AIRCRAFT_INPUT_ITEMS + CONST.MAX_AIRCRAFT_OUTPUT_ITEMS
        ) {
            // set output's preferred units & indicate equation is active
            eqs[i].setPreferredUnits();
            eqs[i].setActiveState(true);
            // Add output to screen
            this.setVariable_(
                eqs[i].getOutput(),
                field++,
                0,
                i++,
                WIDGET_FLAG.CX3_GROUP_VAR_FLAGS,
            );
        }

        // set preferred units (and allow for checking change in units) for intermediate calculations
        while (i < eqs.length) {
            eqs[i].setPreferredUnits();
            eqs[i].setActiveState(true);

            i++;
        }
    } else if (_eq == holdPatternScreen) {
        // setup
        var i = 0;
        var field = 0;
        var flags = 0;

        // For each equation, set output variable & preferred units
        // set appropriate flags for turn direction, entry type
        while (i < eqs.length) {
            eqs[i].setPreferredUnits();
            // indicate equation is active
            eqs[i].setActiveState(true);

            varTemp = eqs[i].getOutput();
            if (varTemp.kind() == entry) flags = WIDGET_FLAG.CX3_ENTRY_TYPE_FLAGS;
            else if (varTemp.kind() == turn_dir)
                flags = WIDGET_FLAG.CX3_TURN_DIR_FLAGS;
            else flags = 0;

            this.setVariable_(varTemp, field++, 0, 0, flags);

            i++;
        }

        // Default: right turns
        if (!TurnDir.hasValue()) {
            TurnDir.copyFromValue(1.0);
            TurnDir.setLock(false);
        }

        // set focus to 1st variable ('Right' turn
        //this.varList_.SetSelected(1);
    } else if (_eq == fuelScreen) {
        // setup
        var i = 0;
        var max_idx = 0;

        // For each equation, set output variable & preferred units
        // set appropriate flags for fueal type
        for (var j = 0; j < eqs.length; j++) {
            eqs[j].setPreferredUnits();
            // indicate equation is active
            eqs[j].setActiveState(true);

            varTemp = eqs[j].getOutput();
            if (varTemp == FuelType) {
                max_idx++;
                this.setVariable_(
                    varTemp,
                    max_idx,
                    0,
                    0,
                    WIDGET_FLAG.CX3_TURN_DIR_FLAGS,
                );
            } else {
                i = this.addVariable(eqs[j].getOutput());
                if (i > max_idx) max_idx = i;
            }
        }

        // Default: 6.0 (av gas LB/US GAL)
        if (!FuelType.hasValue()) {
            FuelType.setValue(6.0 / 8.3454); //default Av Gas (6.0 is LB/GAL from CX-2 manual, default uits LB/L
            //FuelType = 6.0/8.3454;    //default Av Gas (6.0 is LB/GAL from CX-2 manual, default uits LB/L
            FuelType.setLock(false);
        }
    } else if (_eq == convertUnitScreen) {
        var field = 0;

        for (var i = 0; i < eqs.length; i++) {
            varTemp = eqs[i].getOutput();
            // unit conversion - do not change default preferred units
            //var.setUseDefaultUnit(true);
            eqs[i].setPreferredUnits();
            // add output to list
            this.setVariable_(varTemp, field++, 0, 0, 0);
        }
    } else if (_eq == descentScreen || _eq == airspeedScreen) {
        for (var i = 0; i < eqs.length; i++) {
            // set output's preferred units & indicate equation is active
            eqs[i].setPreferredUnits();
            eqs[i].setActiveState(true);

            // add output
            this.addVariable(eqs[i].getOutput());
        }
    } else {
        for (var i = 0; i < eqs.length; i++) {
            // set output's preferred units & indicate equation is active
            eqs[i].setPreferredUnits();
            eqs[i].setActiveState(true);

            for (var j = 0; j < eqs[i].nInputs(); j++) {
                if (eqs[i].getInput(j) != null) {
                    this.addVariable(eqs[i].getInput(j));
                }
            }

            // And add the output too
            this.addVariable(eqs[i].getOutput());
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Sets the current screen definition (equations, variables) for
///    Weight & Balance equations (variable number of items and start position)
///
///  @param [in] <i> <item number to start with (zero for Item #1)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.setItems = function (i, field, focus) {
    field = typeof field !== 'undefined' ? field : 0;
    focus = typeof focus !== 'undefined' ? focus : 0;
    var evt = 0;
    var flags = 0;
    var items_shown = 0;
    var item_status;

    if (i > CONST.MAX_ITEMS) {
        i = 0;
        field = 0;
        focus = 0;
    }
    // If no active items, re-initalize
    if (ItemsActive == 0) {
        ItemsActive = 1;
        ItemActiveMax = 0;
        i = 0;
        ItemUnits[0].ptr = item_noText;
        CONST.ITEMS[0].setPreferredUnit(ItemUnits[0]);
        ItemStatus[0] = 2; //active
        ItemStatus[1] = 1; //'add'

        for (var j = 2; j < CONST.MAX_ITEMS; j++) {
            ItemStatus[j] = 0; //not active
        }

        // set focus on 1st field
        focus = 0;
    }

    // iterate through all the equations on this screen
    var eqs = this.eqScreen_.equations();
    var idx = 3 * i;

    if (i == 0 && field == 0) {
        this.setVariable_(ReductionFactor, field++, 0, 0, 0);
    }

    while (i < CONST.MAX_ITEMS) {
        item_status = ItemStatus[i];
        if (item_status != 0) {
            ItemField[i] = field;
            this.setVariable_(
                CONST.ITEMS[i],
                field++,
                CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED,
                i,
                WIDGET_FLAG.CX3_ITEM_FLAGS,
            );
        } else if (items_shown != 0) {
            break;
        }

        if (item_status == 2) {
            //add variables (slightly different implementation than other equations)
            items_shown++;
            for (var j = 0; j < 3; j++) {
                // set output's preferred units & indicate equation is active
                eqs[idx].setPreferredUnits();
                eqs[idx].setActiveState(true);

                this.setVariable_(
                    eqs[idx].getOutput(),
                    field++,
                    0,
                    i,
                    WIDGET_FLAG.CX3_GROUP_VAR_FLAGS,
                );

                idx++;
            }
        } else {
            idx += 3;
        }

        i++;
    }

    // add totals to end of list (no more than 3 shown items
    //if (field < (ARRAY_SIZE(this.fields_) - 4))
    //{
    this.setVariable_(
        Totals,
        field++,
        0,
        CONST.MAX_ITEMS,
        WIDGET_FLAG.CX3_ITEM_FLAGS,
    );
    eqs = this.eqScreen_.equations();
    idx = 3 * CONST.MAX_ITEMS;
    // add total variables to list
    for (var j = 0; j < 3; j++) {
        eqs[idx].setPreferredUnits();
        eqs[idx].setActiveState(true);

        this.setVariable_(
            eqs[idx].getOutput(),
            field++,
            0,
            CONST.MAX_ITEMS,
            WIDGET_FLAG.CX3_GROUP_VAR_FLAGS,
        );

        idx++;
    }

    // set preferred units (and allow for checking change in units) for intermediate calculations
    while (idx < eqs.length) {
        eqs[idx].setPreferredUnits();
        eqs[idx].setActiveState(true);

        idx++;
    }
    //}

    // clear remaining fields
    while (field < this.fields_.length) {
        this.fields_[field].clearVariable();
        //this.varList_.Unlink(this.fields_[field++]);
        this.removeChild(this.fields_[field++]);
    }

    // set focus
    this.activeChild = this.fields_[focus];
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Changes the current screen definition (equations, variables) for
///    Weight & Balance equations (variable number of items and start position)
///    Used to add or remove an item
///
///  @param [in] <i> <item number to start with (zero for Item #1)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.changeItems = function (i) {
    var evt = 0;
    var varTemp;
    var idx;

    // verify in range
    if (i >= CONST.MAX_ITEMS) {
        return false;
    }

    // unit set to 'next change' by CalulatorFieldWidget
    // set associated field position
    var field = ItemField[i];
    var focus = field;

    // kill focus
    this.activeChild = undefined;
    //KillFocus(this.varList_.GetThing(focus));

    // add variable
    if (ItemUnits[i].ptr == item_remove) {
        ItemsActive++;
        focus++; //set focus to 1st variable

        ItemStatus[i] = 2;
        if (i > ItemActiveMax) {
            ItemActiveMax = i;
            if (i + 1 < CONST.MAX_ITEMS) {
                ItemStatus[i + 1] = 1; //click to add another item
            }
        }

        // send change notification to update totals (clear invalid totals)
        eqs = this.eqScreen_.equations();
        idx = 3 * i;
        for (var j = 0; j < 3; j++) {
            varTemp = eqs[idx].getOutput();
            varTemp.changed();
            idx++;
        }

        if (ItemUnits[0].ptr == item_noText) {
            ItemUnits[0].ptr = item_remove;
            CONST.ITEMS[0].changed();
        }
    } else if (ItemUnits[i].ptr == item_add) {
        ItemsActive--;
        ItemStatus[i] = 1;
        //focus--;

        // clear variables
        eqs = this.eqScreen_.equations();
        idx = 3 * i;
        for (var j = 0; j < 3; j++) {
            varTemp = eqs[idx].getOutput();
            if (varTemp.hasValue()) {
                varTemp.clearValue();
            } else {
                varTemp.changed();
            }
            idx++;
        }

        //check to see if item = ActiveItemMax
        if (i == ItemActiveMax) {
            // set new max
            ItemActiveMax--;

            // make sure next higher value is also zero
            if (i < CONST.MAX_ITEMS - 1) {
                ItemStatus[i + 1] = 0;
            }

            if (ItemStatus[i - 1] != 1) {
                // skip 'setVariable' for "item" in setItems() below
                i++;
                field++;
            } else {
                // if next item also inactive - clear item status, decrement item, and re-check
                while (ItemStatus[i - 1] == 1 && i > 1) {
                    ItemStatus[i] = 0;
                    i--;

                    field = ItemField[i];
                    ItemActiveMax--;
                    // set focus to new item
                    focus = field;
                }
            }
        } else {
            // skip 'setVariable' for "item" in setItems() below
            i++;
            field++;
        }

        // if no active items remain - return false
        if (ItemsActive == 0) {
            return false;
        }
    } else {
        // this is the only item and can not be added or removed
        return true;
    }

    //Unlink(this.varList_);
    this.setItems(i, field, focus);
    //Link(this.varList_);

    return true;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Sets the current screen definition (equations, variables) for
///    Rhumb Line equations (variable number of items )
///
///  @param [in] <i> <item number to start with (zero for Item #1)>
///  @param [in] <field> <field associated with this item number (if modifying current list)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.setRhumbItems = function (i, field, focus) {
    field = typeof field !== 'undefined' ? field : 0;
    focus = typeof focus !== 'undefined' ? focus : 0;
    var evt = 0;
    var items_shown = 0;
    var item_status;

    if (i > CONST.MAX_RHUMB_ITEMS) {
        i = 0;
        field = 0;
        focus = 0;
    }
    // If no active items, re-initialize
    // TODO: remove if not needed (initialize status in equation screen constructor)
    if (RhumbItemsActive == 0) {
        RhumbItemsActive = 3;
        RhumbItemActiveMin = 0;
        RhumbItemActiveMax = 2;
        i = 0;
        //ItemUnits[0] = &item_noText;
        //CONST.ITEMS[0].setPreferedUnit(&ItemUnits[0]);
        RhumbItemStatus[0] = 2; //active
        RhumbItemStatus[1] = 2;
        RhumbItemStatus[2] = 2;
        RhumbItemStatus[3] = 1; //'add'
        RhumbItemStatus[4] = 1;

        for (var j = 5; j < CONST.MAX_RHUMB_ITEMS; j++) {
            RhumbItemStatus[j] = 0; //not active
        }

        // set focus to 1st item
        focus = 0;
    }

    // iterate through all the equations on this screen
    var eqs = this.eqScreen_.equations();
    var idx = 3 * i;

    while (i < CONST.MAX_RHUMB_ITEMS) {
        item_status = RhumbItemStatus[i];
        if (item_status != 0) {
            evt = CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED;
            RhumbItemField[i] = field;
            //(*pEq).setPreferredUnits();
            //assert(this.setVariable_(&(*pEq).getOutput(), field++,evt, i, CX3_ITEM_FLAGS) == true);
            this.setVariable_(
                eqs[idx].getOutput(),
                field++,
                evt,
                i,
                WIDGET_FLAG.CX3_ITEM_FLAGS,
            );

            idx++;
        } else if (items_shown != 0) {
            break;
        }

        if (item_status == 2) {
            //add variables (slightly different implementation than other equations)
            items_shown++;
            for (var j = 0; j < 2; j++) {
                //(*pEq).setPreferredUnits();
                //assert(this.setVariable_(&(*pEq).getOutput(), field++, 0, i, CX3_GROUP_VAR_FLAGS) == true);
                this.setVariable_(
                    eqs[idx].getOutput(),
                    field++,
                    0,
                    i,
                    WIDGET_FLAG.CX3_GROUP_VAR_FLAGS,
                );

                idx++;
            }
        } else {
            idx += 2;
        }

        i++;
    }

    // clear remaining fields
    while (field < this.fields_.length) {
        this.fields_[field].clearVariable();
        //this.varList_.Unlink(this.fields_[field++]);
        this.removeChild(this.fields_[field++]);
    }

    // set all preffered units for proper updates on global unit changes for lattitude & longitude
    // NOTE: set AFTER list setup & clear remaining fields (clearVariable will clear use_default_units
    // for proper operation of other equations/lists
    eqs = this.eqScreen_.equations();
    for (var j = 0; j < eqs.length; j++) {
        eqs[j].setPreferredUnits();
        eqs[j].setActiveState(true);
    }

    // set focus
    this.activeChild = this.fields_[focus];
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Changes the current screen definition (equations, variables) for
///    Rhumb Line equations (variable number of items and start position)
///    Used to add or remove an item
///
///  @param [in] <i> <item number to start with (zero for Item #1)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.changeRhumbItems = function (i) {
    var evt = 0;
    var eqs;
    var varTemp;
    var idx;

    // verify in range
    if (i >= CONST.MAX_RHUMB_ITEMS) {
        return false;
    }

    // set associated field position
    var field = RhumbItemField[i];
    var focus = field;

    // kill focus
    this.activeChild = undefined;
    //KillFocus(this.varList_.GetThing(focus));

    // add variable
    eqs = this.eqScreen_.equations();
    idx = 3 * i;
    varTemp = eqs[idx].getOutput();

    // unit set to 'next change' by CalulatorFieldWidget
    // add item
    if (varTemp.myPreferredUnit() == item_remove) {
        //RhumbItemsActive++;
        RhumbItemStatus[i] = 2;
        focus++;

        //if (i > ItemActiveMax)
        //{
        //ItemActiveMax = (uint8_t)(i);
        if (i + 1 < CONST.MAX_RHUMB_ITEMS && RhumbItemStatus[i + 1] == 0) {
            RhumbItemStatus[i + 1] = 1; //click to add another item
        }
        //}

        //if (ItemUnits[0] == &item_noText)
        if (PointA.myPreferredUnit() == item_noText) {
            PointA.rotatePreferredUnit(false); // no_text . add
            PointA.rotatePreferredUnit(false); // add . remove
        }
        if (PointB.myPreferredUnit() == item_noText) {
            PointB.rotatePreferredUnit(false);
            PointB.rotatePreferredUnit(false);
        }
        if (RhumbLineAB.myPreferredUnit() == item_noText) {
            RhumbLineAB.rotatePreferredUnit(false);
            RhumbLineAB.rotatePreferredUnit(false);
        }
    }
    // remove item
    else if (varTemp.myPreferredUnit() == item_add) {
        RhumbItemStatus[i] = 1;

        // if NOT last item - increment i and field
        if (i != CONST.MAX_RHUMB_ITEMS - 1) {
            i++;
            field++;
        }
    } else {
        // this is the 1st set and can not be removed
        return true;
    }

    //Unlink(this.varList_);
    this.setRhumbItems(i, field, focus);
    //Link(this.varList_);

    return true;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    If the specified variable is not in our varList, then it is addedif
///    there is room.
///
///  @param [in] <v> <variable to add>
///
///  @return <-1 if there was no room in the list, slot assigned to variable otherwise>
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.addVariable = function (v) {
    // is this a new variable?
    for (var i in this.fields_) {
        if (this.fields_[i].getVariable() === v) {
            return i; // not an error, this variable is already in the list
        }
    }

    // yes, add it to our list in the first available slot
    for (var i in this.fields_) {
        if (!this.fields_[i].hasVariable()) {
            this.fields_[i].setVariable(v);
            this.addChild(this.fields_[i]);
            return i;
        }
    }

    return -1; // no room
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Add specified variable to a specific field if in range
///
///  @param [in] <v> <variable to add>
///  @param [in] <i> <where to add in field array>
///  @param [in] <v> <event associated with this item>
///  @param [in] <v> <event paramater to send with event>
///
///  @return <false if there was no room in the list, true otherwise>
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.setVariable_ = function (v, i, evt, param, flags) {
    flags = typeof flags !== 'undefined' ? flags : 0;

    // make sure field location in range
    if (i < this.fields_.length) {
        if (this.fields_[i].hasVariable()) {
            this.fields_[i].clearVariable();
        }
        this.fields_[i].setVariable(v, evt, param, flags);
        this.addChild(this.fields_[i]);
        return true;
    }

    return false; // no room
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Shows the current setting options screen
///
///  @param [in] <index> <index to setting>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.ShowSettingOptions = function (index) {
    //uint16_t flags;
    //Variable * var;
    //Time clock_time;
    //uint8_t current_option;
    var flags;
    var var_temp;
    var clock_time;
    var current_option;

    // clear current equation screen
    this.ClearEquation();

    // make sure that we've allocated our memory
    //assert(this.fields_ != null);

    // Set the screen title - setting name
    var_temp = CONST.SETTINGS[index];
    //assert(this.title_ != null);
    this.subTitle = var_temp.name();

    // kill previous focus (for back to clock settings after timezone selection)
    current_option = this.GetSelectedIndex();
    // NOTE by Dean: Is this needed?
    this.activeChild = undefined;
    //KillFocus(this.varList_.GetThing(current_option));

    // Clear the widget list
    //Unlink(this.varList_);
    this.clearListData();

    // Set Default Unit processing
    if (var_temp == DefaultUnits) {
        // Get current default setting index
        current_option = CONST.SETTINGS[index].kind().getDefaultUnit();
        var custom_option = CONST.SETTINGS[index].kind().getUnitIndex(units_custom);
        //Unit const * * options = CONST.SETTINGS[index].units();
        var options = CONST.SETTINGS[index].units();

        // Fill in list
        var i = 0;

        // removed custom option - not compatible with changing similar units
        // TODO: set groups and change similar settings??
        //  Group A: Length, Fuel Rate & Volume (set LB/KG per HR by weight), Weight, Torque
        //  Group B: Ground Speed, Distance, Altitude (Desc), RoC, AoC
        //  Independent: Air Speed, Duration, Temperature, Pressure, Position
        //while((options[i] != null) && ( i <  ARRAY_SIZE(this.fields_)))
        while (i < custom_option) {
            if (i == current_option) {
                flags = WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS;
                if (i == custom_option)
                    this.fields_[i].setOption(
                        var_temp,
                        options[i].name(),
                        'Edit',
                        CX3_WIDGET_EVENT.OPTION_SELECTED,
                        i,
                        flags,
                    );
                else
                    this.fields_[i].setOption(
                        var_temp,
                        options[i].name(),
                        'Re-set',
                        CX3_WIDGET_EVENT.OPTION_SELECTED,
                        i,
                        flags,
                    );
            } else {
                flags =
                    WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
                    WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS;
                if (i == custom_option)
                    this.fields_[i].setOption(
                        var_temp,
                        options[i].name(),
                        'Set&Edit',
                        CX3_WIDGET_EVENT.OPTION_SELECTED,
                        i,
                        flags,
                    );
                else
                    this.fields_[i].setOption(
                        var_temp,
                        options[i].name(),
                        'Set',
                        CX3_WIDGET_EVENT.OPTION_SELECTED,
                        i,
                        flags,
                    );
            }
            //this.varList_.LinkTail(this.fields_[i]);
            this.addChild(this.fields_[i]);

            i++;
        }

        this.SetSelected(current_option);
    }
    // Set Clock processing (timezone settings below)
    else if (var_temp == Clock) {
        // set pointer to 'set clock' equations
        //Equation* const * pEq_unit = clockSetEqus;
        var pEq_unit = CONST.clockSetEqus;

        // fill in list
        for (i = 0; i < pEq_unit.length; i++) {
            pEq_unit[i].setPreferredUnits();
        }

        // Clock - current time
        clock_time = GetClock();
        clock_time.hours += 24;
        TimeUTC.setLock(false);
        TimeUTC.clearValue();
        TimeUTC.copyFromValue(
            clock_time.hours * 3600 + clock_time.minutes * 60 + clock_time.seconds,
        );
        TimeLocal.copyFromVariable(TimeUTC);
        TimeDest.copyFromVariable(TimeUTC);

        // Show current time - hide icon, send event on lost focus is changed/cleared
        this.setVariable_(
            TimeUTC,
            0,
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            0,
            WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
            WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE |
            WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER,
        );
        this.setVariable_(
            TimeLocal,
            1,
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            1,
            WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
            WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE |
            WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER,
        );
        this.setVariable_(
            TimeDest,
            2,
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            2,
            WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
            WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE |
            WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER,
        );

        // Show 'Set Timezone' options
        this.setVariable_(
            SetTimezone,
            3,
            CX3_WIDGET_EVENT.SETTING_SELECTED,
            CONST.SETTING_ID.ZONE_LOCAL,
            WIDGET_FLAG.CX3_TIMEZONE_ITEM_FLAGS,
        );
        this.setVariable_(
            TimeLocal,
            4,
            CX3_WIDGET_EVENT.SETTING_SELECTED,
            CONST.SETTING_ID.ZONE_LOCAL,
            WIDGET_FLAG.CX3_TIMEZONE_SET_FLAGS,
        );
        this.setVariable_(
            TimeDest,
            5,
            CX3_WIDGET_EVENT.SETTING_SELECTED,
            CONST.SETTING_ID.ZONE_DEST,
            WIDGET_FLAG.CX3_TIMEZONE_SET_FLAGS,
        );

        // set focus on last selected (default local time)
        if (SetTimezone.hasNoValue()) {
            SetTimezone.copyFromValue(1);
        }
        current_option = SetTimezone.value();
        if (current_option <= 5 && current_option != 3) {
            this.SetSelected(current_option);
        } else {
            this.SetSelected(1);
        }
    } else if (var_temp == ZoneLocal || var_temp == ZoneDest) {
        if (var_temp.hasValue()) {
            current_option = var_temp.value();
        } else {
            current_option = CONST.TIME_ZONE_UTC;
        }

        for (i = 0; i < CONST.TIMEZONES.length; i++) {
            flags =
                WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS |
                WIDGET_FLAG.CX3_TIMER_ITEM |
                WIDGET_FLAG.CX3_SETTING_NO_VAR_LINK;
            if (i != current_option) {
                flags |= WIDGET_FLAG.CX3_HIDE_STATUS_ICON;
            }

            this.fields_[i].setOption(
                var_temp,
                CONST.TIMEZONES[i].desc,
                CONST.TIMEZONES[i].name,
                CX3_WIDGET_EVENT.OPTION_SELECTED,
                i,
                flags,
            );
            //this.varList_.LinkTail(this.fields_[i]);
            this.addChild(this.fields_[i]);
        }

        this.SetSelected(current_option);
    }
    // Set Favorites processing
    else if (var_temp == Favorite) {
        // for each equation available, add a list element that contains the title
        // of the equation, a callback to execute when the element is selected,
        // and any arguments to pass to the callback.
        //EquationScreenDefinition const **screen = screens();
        var screen = this.screens();
        if (Favorite.hasValue()) {
            current_option = Favorite.value();
        } else {
            current_option = 255;
        }

        for (i = 0; i < screen.length; i++) {
            flags =
                WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS |
                WIDGET_FLAG.CX3_STRETCH_NAME_UNITS |
                WIDGET_FLAG.CX3_SETTING_NO_VAR_LINK;
            if (!(i == current_option)) flags |= WIDGET_FLAG.CX3_HIDE_STATUS_ICON;

            this.fields_[i].setOption(
                var_temp,
                screen[i].title(),
                ' ',
                CX3_WIDGET_EVENT.OPTION_SELECTED,
                i,
                flags,
            );
            //this.varList_.LinkTail(this.fields_[i]);
            this.addChild(this.fields_[i]);
        }
        if (current_option == 255) {
            current_option = 0;
        }

        this.SetSelected(current_option);
    }
    // Set Aircraft Profile processing
    else if (var_temp == AircraftProfile) {
        if (DEBUG) {
            console.log('EquationScreen.prototype.ShowSettingOptions');
            console.log('AircraftProfile');
        }
        // re-set ProfileRecoveryFactor if cleared
        if (ProfileRecoveryFactor.hasNoValue()) {
            ProfileRecoveryFactor.copyFromValue(RecoveryFactor.value());
            ProfileRecoveryFactor.setCopied(true);
        }
        // fill in list
        var i = 0;

        // Instrument calibration - default 1.0 and 'copied'
        this.setVariable_(Calibration, i++, 0, 0, WIDGET_FLAG.CX3_ITEM_FLAGS); // "Instrument Calibration" label row
        // TAT/OAT calibration factor K (aka 'reduction factor')
        // default value 1.0, send event on lost focus is changed/cleared
        this.setVariable_(
            ProfileRecoveryFactor,
            i,
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            i,
            WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE,
        );
        i++;

        // Weight & Balance - Aircraft Profile
        this.setVariable_(
            AircraftWtBalProfile,
            i++,
            0,
            0,
            WIDGET_FLAG.CX3_ITEM_FLAGS,
        ); // "Weight & Balance Profile" label row

        // TODO: TESTING
        // this.setVariable_(ShouldUseProfileForWtBalCalcs, i++, CX3_WIDGET_EVENT.OPTION_SELECTED, 0, WIDGET_FLAG.CX3_TURN_DIR_FLAGS);
        // if (ShouldUseProfileForWtBalCalcs.hasNoValue()) {
        //   // ShouldUseProfileForWtBalCalcs.value = 1.0;  // this way the val changes to a ? when the enter key is pressed
        //   //ShouldUseProfileForWtBalCalcs.setValue(1.0);  // do it this way
        //   ShouldUseProfileForWtBalCalcs.setValue(false);
        //   ShouldUseProfileForWtBalCalcs.setLock(false);
        // }

        //this.setVariable_(AircraftWtBal, i++, 0, 0, WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS); // AircraftWtBal: aircraft profile valid
        // add event handling for this value
        // this.setVariable_(AircraftWtBal, i, CX3_WIDGET_EVENT.OPTION_SELECTED, i, WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS); // AircraftWtBal: aircraft profile valid
        // this.setVariable_(AircraftWtBal, i, 0, 0, WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE); // AircraftWtBal: aircraft profile valid
        // i++

        this.setVariable_(AircraftWtBal, i++, 0, 0, WIDGET_FLAG.CX3_TURN_DIR_FLAGS); // AircraftWtBal: aircraft profile valid
        if (!AircraftWtBal.hasValue()) {
            AircraftWtBal.setValue(1.0);
            AircraftWtBal.setLock(false);
        }

        // Empty Aircraft
        AircraftRF.setReadOnly(false); //make sure RF allows user input
        this.setVariable_(
            AircraftEmpty,
            i++,
            0,
            0,
            WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS,
        );
        this.setVariable_(AircraftRF, i++, 0, 0, WIDGET_FLAG.CX3_INDENT_LEFT);
        // set pointer to empty Aircraft equations
        var pEq_unit = CONST.emptyAircraftEqus;
        for (var temp = 0; temp < pEq_unit.length; temp++) {
            console.log(pEq_unit[temp]);
            // set  preferred units & indicate active (to catch unit changes)
            pEq_unit[temp].setPreferredUnits();
            pEq_unit[temp].setActiveState(true);
            // add output variable to screen
            this.setVariable_(
                pEq_unit[temp].getOutput(),
                i++,
                0,
                0,
                WIDGET_FLAG.CX3_INDENT_LEFT,
            );
        }

        // Fuel
        this.setVariable_(
            AircraftFuel,
            i++,
            0,
            0,
            WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS,
        );
        // Fuel Type default value: 6.0 (av gas LB/US GAL)
        if (!AircraftFuelType.hasValue()) {
            AircraftFuelType.copyFromValue(6.0 / 8.3454); //default Av Gas (6.0 is LB/GAL from CX-2 manual, default uits KG/L
            AircraftFuelType.setLock(false);
        }

        // set pointer to aircraft fuel equations
        pEq_unit = CONST.aircraftFuelEqus;
        for (var temp = 0; temp < pEq_unit.length; temp++) {
            // set  preferred units
            pEq_unit[temp].setPreferredUnits();
            // add output variable to screen
            var_temp = pEq_unit[temp].getOutput();
            if (var_temp == AircraftFuelType) {
                this.setVariable_(
                    var_temp,
                    i++,
                    0,
                    0,
                    WIDGET_FLAG.CX3_INDENT_LEFT | WIDGET_FLAG.CX3_TURN_DIR_FLAGS,
                );
            } else {
                this.setVariable_(var_temp, i++, 0, 0, WIDGET_FLAG.CX3_INDENT_LEFT);
            }
        }

        // Individual item arms
        this.setVariable_(
            AircraftItems,
            i++,
            0,
            0,
            WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS,
        );
        // set pointer to aircraft item arm equations
        pEq_unit = CONST.aircraftItemArmEqus;
        for (var temp = 0; temp < pEq_unit.length; temp++) {
            // set  preferred units
            pEq_unit[temp].setPreferredUnits();
            // add output variable to screen
            this.setVariable_(
                pEq_unit[temp].getOutput(),
                i++,
                0,
                0,
                WIDGET_FLAG.CX3_INDENT_LEFT,
            );
        }

        // set equation screen to clear 'active' variables when another equation loaded
        this.eqScreen_ = aircraftProfileScreen;
    }
    // User Data setup
    else if (var_temp == UserData) {
        // set units
        //Unit const * * options = CONST.SETTINGS[index].units();
        var options = CONST.SETTINGS[index].units();

        // Fill in list
        this.fields_[0].setOption(
            var_temp,
            options[0].name(),
            ' ',
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            0,
            WIDGET_FLAG.CX3_HIDE_STATUS_ICON | WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS,
        );
        //this.varList_.LinkTail(this.fields_[0]);
        this.addChild(this.fields_[0]);
        this.fields_[1].setOption(
            var_temp,
            options[1].name(),
            ' ',
            CX3_WIDGET_EVENT.OPTION_SELECTED,
            1,
            WIDGET_FLAG.CX3_HIDE_STATUS_ICON | WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS,
        );
        //this.varList_.LinkTail(this.fields_[1]);
        this.addChild(this.fields_[1]);
        var i = 2;
        // 'recall' option only if valid NV data
        if (UserMemValid()) {
            this.fields_[2].setOption(
                var_temp,
                options[2].name(),
                ' ',
                CX3_WIDGET_EVENT.OPTION_SELECTED,
                2,
                WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
                WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS,
            );
            //this.varList_.LinkTail(this.fields_[2]);
            this.addChild(this.fields_[2]);
            i = 3;
        }
        this.SetSelected(0);
    } else {
        // Get current default setting index
        current_option = CONST.SETTINGS[index].kind().getDefaultUnit();
        //Unit const * * options = CONST.SETTINGS[index].units();
        var options = CONST.SETTINGS[index].units();

        // Fill in list
        var i = 0;
        while (i < options.length && i < this.fields_.length) {
            if (i == current_option) flags = WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS;
            else
                flags =
                    WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
                    WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS;

            this.fields_[i].setOption(
                var_temp,
                options[i].name(),
                ' ',
                CX3_WIDGET_EVENT.OPTION_SELECTED,
                i,
                flags,
            );
            //this.varList_.LinkTail(this.fields_[i]);
            this.addChild(this.fields_[i]);

            i++;
        }

        this.SetSelected(current_option);
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set Default Units to specified standard -or- customize current units
///
///  @param [in] <index> <index to the standard to use, or to the 'custom' selection>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.SetDefaultUnits = function (index) {
    //Variable * var_temp;
    //const Unit * def_unit;
    //const Unit ** pUnit;
    var var_temp;
    var def_unit;
    var pUnit;

    // clear current equation screen pointer
    //this.eqScreen_ = null;

    // make sure that we've allocated our memory
    //assert(this.fields_ != null);

    // Set the screen title - setting name
    var_temp = DefaultUnits;
    //assert(this.title_ != null);
    this.title = var_temp.name();

    // Clear the widget list (Unlink first to avoid unneeded viewport allocation in prism)
    //Unlink(this.varList_);
    this.clearListData();

    // check current setting (set/re-set to specified standard or custom settings)
    pUnit = [];
    pUnit_index = 0;
    def_unit = DefaultUnits.kind().defaultUnit();
    if (def_unit == units_us) {
        pUnit = us_default_units;
    } else if (def_unit == units_metric) {
        pUnit = metric_default_units;
    }

    // Set Default Unit processing
    //if (var_temp == &DefaultUnits)
    {
        // set screen
        this.eqScreen_ = CONST.setDefaultUnitScreens[0];
        //Equation* const * pEq = this.eqScreen_.equations();
        var pEq = this.eqScreen_.equations();
        var pEq_index = 0;

        // set pointer to equations for 'set default unit' screen
        //Equation* const * pEq_unit = setDefaultUnitEqus;
        var pEq_unit = CONST.setDefaultUnitEqus;
        var pEq_unit_index = 0;

        // fill in list
        var i = 0;

        while (pEq_unit_index < pEq_unit.length) {
            // set  preferred units & add output to list
            pEq_unit[pEq_unit_index].setPreferredUnits();
            var_temp = pEq_unit[pEq_unit_index].getOutput();
            this.fields_[i].setOption(
                var_temp,
                this.eqScreen_.title(),
                var_temp.myPreferredUnit().name(),
                CX3_WIDGET_EVENT.SET_DEFAULT_UNIT,
                i,
                WIDGET_FLAG.CX3_SET_UNIT_FLAGS,
            );
            this.addChild(this.fields_[i]);

            // TODO: reset all units here or only when changed (individually or all to US/metric/etc)
            if (pUnit[pUnit_index] == undefined) {
                def_unit = var_temp.myPreferredUnit();
            } else {
                def_unit = pUnit[pUnit_index];
                pEq_unit[pEq_unit_index].setNewPreferredUnits(def_unit);
            }

            while (pEq_index < pEq.length) {
                if (typeof pEq[pEq_index].setNewPreferredUnits === "function") { 
                    pEq[pEq_index].setNewPreferredUnits(def_unit);
                }
                pEq_index++;
            }

            i++;
            this.eqScreen_ = CONST.setDefaultUnitScreens[i];
            if (this.eqScreen_ != undefined) {
                pEq = this.eqScreen_.equations();
                pEq_index = 0;
            }

            pEq_unit_index++;
            if (pUnit[pUnit_index] != undefined) {
                pUnit_index++;
            }
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Retrieve a list of equation screens (E6-B functions).
///
///  @return <Pointer to a null terminated array of EquationScreenDefinition
///        pointers>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.screens = function () {
    return CONST.equationScreens;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Retrieve a list of trip planner equation screens.
///
///  @return <Pointer to a null terminated array of EquationScreenDefinition
///        pointers>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.tripScreens = function () {
    return CONST.tripPlanerEquationScreens;
};
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Clear all the items in the list and their data (but do not delete them)
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.clearListData = function () {
    this.activeChild = undefined;
    for (var i = 0; i < this.fields_.length; i++) {
        this.fields_[i].clearVariable();
        this.removeChild(this.fields_[i]);
    }
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Process 'Item Changed' event
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventItemChanged = function (Event) {
    // Weight & Balance
    if (this.eqScreen_ == weightBalanceScreen) {
        var item = Event.param;
        if (item < CONST.MAX_ITEMS) {
            if (this.changeItems(item) == false) {
                //Unlink(this.varList_);
                this.setItems(item);
                //Link(this.varList_);
            }
        }
    }
    // Rhumb Line
    else if (this.eqScreen_ == rhumbLineScreen) {
        var item = Event.param;
        if (item < CONST.MAX_RHUMB_ITEMS) {
            if (this.changeRhumbItems(item) == false) {
                //Unlink(this.varList_);
                this.setRhumbItems(item);
                //Link(this.varList_);
            }
        }
    }

    Event['handled'] = true;

    return 0;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Process 'Set Default Unit' event
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventSetDefaultUnit = function (Event) {
    var _var;
    var def_unit;

    // set pointer to equations to update default unit
    this.eqScreen_ = CONST.setDefaultUnitScreens[Event.param];
    var eqs = this.eqScreen_.equations();

    // set pointer to equation with updated default unit
    var pEq_unit = CONST.setDefaultUnitEqus[Event.param];
    // set  preferred units
    pEq_unit.setPreferredUnits();
    _var = pEq_unit.getOutput();

    // TODO: reset all units here or only when changed (individually or all to US/metric/etc)
    def_unit = _var.myPreferredUnit();
    for (var idx = 0; idx < eqs.length; idx++) {
        eqs[idx].setNewPreferredUnits(def_unit);
    }

    return 0;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Process 'Previous Item (scroll up)' event
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventItemPrevious = function (Event) {
    // Weight & Balance
    if (this.eqScreen_ == weightBalanceScreen) {
        // scroll up 1 item
        var item = Event.param;
        if (item < CONST.MAX_ITEMS) {
            if (item != 0) {
                item--;
            }

            //Unlink(this.varList_);
            this.setItems(item);
            //Link(this.varList_);
        }
    }
    // Rhumb Line
    else if (this.eqScreen_ == rhumbLineScreen) {
        // scroll up 1 item
        var item = Event.param;
        if (item < CONST.MAX_RHUMB_ITEMS) {
            if (item != 0) {
                item--;
            }

            //Unlink(this.varList_);
            this.setRhumbItems(item);
            //Link(this.varList_);
        }
    }

    return 0;
};

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Process 'Next Item (scroll down)' event
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventItemNext = function (Event) {
    // Weight & Balance
    if (this.eqScreen_ == weightBalanceScreen) {
        // re-load list starting with this item
        var item = Event.param;
        if (item < CONST.MAX_ITEMS) {
            //Unlink(this.varList_);
            this.setItems(item);
            //Link(this.varList_);
        }
    }
    // Rhumb Line
    else if (this.eqScreen_ == rhumbLineScreen) {
        // re-load list starting with this item
        var item = Event.param;
        if (item < CONST.MAX_RHUMB_ITEMS) {
            //Unlink(this.varList_);
            this.setRhumbItems(item);
            //Link(this.varList_);
        }
    }

    return 0;
};

/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process 'Next Item (scroll down)' event  
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventRollOnEnter = function(const pm_event_t &Event) { 
  uint8_t idx = this.varList_.GetSelectedIndex();

  // attempt to 'roll' to next list item
  this.varList_.SelectNext();

  // if focus did not change (no selectable items below), change focus to top of list
  if (idx == this.varList_.GetSelectedIndex())
    this.varList_.SetSelected(0);

  return 0; 
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Event callback for when the screen is unlinked from the parent (and 
///      removed from view.  Makes sure that no items keep their selected
///      state next time this screen is shown.  Prism doesn't do this by
///      default.
///
///  @param [in] <Event> <event data (id, parameters, source, etc.>
///
///  @return <always returns 0>
///
////////////////////////////////////////////////////////////////////////////////
EquationScreen.prototype.OnEventHide = function(const pm_event_t &Event) {
  Pm_Panel::OnEventHide(Event);

  int size = this.varList_.GetNumItems();
  for (int i = 0; i < size; i++) {
    KillFocus(this.varList_.GetThing(i));
  }

  return 0;
}
*/
