///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 919 $
// @date    $Date: 2013-06-24 09:30:15 -0700 (Mon, 24 Jun 2013) $
// @brief   Widget that stores displays a variable for an equation 
//      and its status.
//

//#include "calculatorFieldWidget.h"
//#include "variables.h"
//#include "definedUnits.h"
//#include "definedVariables.h"
//#include "CX3_UI_res.h"
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include <stdlib.h>
//#include <stdio.h>
//#include <string.h>
//#include <cassert>
//#include <string.h>
//#include <math.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif

// === FROM CX3Display === //
//////////////////////////////////////////////////////////////////////////////////////////////
/// CX3 display flags
/// @brief
/// These flags are used adjust the position or hide widgets and to control which keys are valid
/// for data entry
var WIDGET_FLAG = {
    CX3_HIDE_STATUS_ICON: 0x0001,
    CX3_HIDE_VALUE: 0x0002,
    CX3_STRETCH_NAME_UNITS: 0x0004,  // list 'items' 
    CX3_IGNORE_NON_EVENT_KEYS: 0x0008,  // list 'items' 
    CX3_IGNORE_KEYS_EXCEPT_ENTER: 0x0010,  // holding pattern turn direction & entry type
    CX3_INDENT_LEFT: 0x0020,  // grouped variables
    CX3_SELECT_ITEM_ON_ENTER: 0x0040,  // OLD - holding pattern turn direction - hide status icon if not selected
    CX3_DISPLAY_UNIT_AS_VALUE: 0x0080,  // holding pattern entry type, settings main screen (large text only),
    CX3_ALLOW_UNIT_CHANGE_ONLY: 0x0100,  // set default unit 
    CX3_ALLOW_ROTATE_UNIT_ONLY: 0x0200,  // NEW - holding pattern turn direction (single line - unit = turn direction),
    CX3_TIMER_ITEM: 0x0400,  // timer items
    CX3_SETTING_NO_VAR_LINK: 0x0800,  // settings - don't link to variable (not needed when selecting option),
    CX3_NON_SELECTABLE: 0x1000,  // this line is not selectable by user
    CX3_CHECK_ON_CALCULATED: 0x2000,  // display 'check' instead of 'equal' icon when computed
    CX3_SEND_EVT_DIRTY_OR_NOVALUE: 0x4000,  // setting changed or cleared before up/down arrow - send event to process change
};

/// @brief
/// Flag settings for common list items 

WIDGET_FLAG.CX3_ITEM_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_STRETCH_NAME_UNITS |
    WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS);

WIDGET_FLAG.CX3_GROUP_VAR_FLAGS = (
    WIDGET_FLAG.CX3_INDENT_LEFT);

WIDGET_FLAG.CX3_OLD_TURN_DIR_FLAGS = (
    WIDGET_FLAG.CX3_INDENT_LEFT |
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER |
    WIDGET_FLAG.CX3_SELECT_ITEM_ON_ENTER);

WIDGET_FLAG.CX3_TURN_DIR_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE |
    WIDGET_FLAG.CX3_ALLOW_ROTATE_UNIT_ONLY);

WIDGET_FLAG.CX3_ENTRY_TYPE_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE |
    WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER);
/*
WIDGET_FLAG.CX3_SET_UNIT_FLAGS  (
  WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
  WIDGET_FLAG.CX3_HIDE_VALUE |
  WIDGET_FLAG.CX3_STRETCH_NAME_UNITS |
  WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS);
*/
WIDGET_FLAG.CX3_SET_UNIT_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
    WIDGET_FLAG.CX3_ALLOW_UNIT_CHANGE_ONLY);

WIDGET_FLAG.CX3_TIMEZONE_ITEM_FLAGS = (
    WIDGET_FLAG.CX3_ITEM_FLAGS |
    WIDGET_FLAG.CX3_NON_SELECTABLE);

WIDGET_FLAG.CX3_TIMEZONE_SET_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_STATUS_ICON |
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS);

WIDGET_FLAG.CX3_AIRCRAFT_ITEM_FLAGS = (
    WIDGET_FLAG.CX3_HIDE_VALUE |
    WIDGET_FLAG.CX3_CHECK_ON_CALCULATED |
    WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS);
// === END FROM CX3Display === //

/// @brief
/// Default string displayed when the underlying variable has no value
CONST.UNDEFINED_VAR = "--";

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
//pm_event_table_entry calculatorFieldWidgetEvents[] = {
//  { PM_EVENT_LOST_FOCUS,    PM_EVENT_HANDLER(CalculatorFieldWidget::OnEventLostFocus)},
//  { PM_EVENT_GAINED_FOCUS,  PM_EVENT_HANDLER(CalculatorFieldWidget::OnEventGainedFocus)},
//  { PM_EVENT_KEYPAD_PUSH,   PM_EVENT_HANDLER(CalculatorFieldWidget::OnEventKeypadPush)},
//  { 0, null}   /* array terminator */
//};

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default CalculatorFieldWidget.
///
///  @param [in] <_var> <the variable to display as part of this widget>
///
////////////////////////////////////////////////////////////////////////////////
function CalculatorFieldWidget(_var) {
    Widget.call(this);
    // Create the DOM element for this widget:
    this.ui.addClass("calculator-field");

    this.var_ = null;
    this.clearUserInput_ = true;
    this.dirty_ = false;
    this.icon_ = null;
    if (typeof _var !== "undefined") {
        this.setVariable(_var);
    }
    this.addEvent("cx3-keypress", CalculatorFieldWidget.prototype.OnEventKeypadPush);
    this.addEvent("cx3-focus", CalculatorFieldWidget.prototype.OnEventGainedFocus);
    this.addEvent("cx3-blur", CalculatorFieldWidget.prototype.OnEventLostFocus);

    this.__defaultClass__ = this.ui.className;
}
// CalculatorFieldWidget is a subclass of Widget:
CalculatorFieldWidget.inheritsFrom(Widget);

CalculatorFieldWidget.prototype.showIcon = function (_yes) {
    this.__showIcon__ = _yes;
    this.icon_ = this.icon_;
}

Object.defineProperty(CalculatorFieldWidget.prototype, "icon_", {
    get: function () {
        return this.__icon__;
    },
    set: function (val) {
        this.__icon__ = val;
        if (this.__showIcon__) {
            this.icon = this.__icon__;
        }
        else {
            this.icon = null;
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.release = function () {
    // disconnect from our variable
    if (this.var_ != null)
        this.var_.removeDependent(this);

    // Deattach from the HTMLElement:
    this.deattachUI();
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    returns true if this Widget has a variable; false otherwise.
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.hasVariable = function () {
    return this.var_ != null;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Get's this Widget's variable if it exists or returns null.
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.getVariable = function () {
    if (this.hasVariable()) {
        return this.var_;
    }
    else {
        return null;
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Set the underlying variable that this Widget represents.  Any data 
///    that the variable has will be used to updated the Widget's display.
///
///  @param [in] <_var> <the variable to display>
///
///  @param [in] <evt> <event to post when item is 'clicked'>
///
///  @param [in] <param> <parameter to pass with specified event>
///
///  @param [in] <flags> <flags to control position and hiding of child widgets>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.setVariable = function (_var, evt, param, flags) {
    this.ui.className = this.__defaultClass__;
    evt = (typeof evt !== "undefined") ? evt : 0;
    param = (typeof param !== "undefined") ? param : 0;
    flags = (typeof flags !== "undefined") ? flags : 0;

    // Make sure our variable input is set  
    this.var_ = _var;

    // Set event data & flags
    this.evt_ = evt;
    this.param_ = param;
    this.flags_ = flags;

    // Check for non-selectable item
    /*TODO: check if needed
    if (flags & WIDGET_FLAG.CX3_NON_SELECTABLE)
      RemoveStatus(PM_SF_SELECTABLE);
    else
      AddStatus(PM_SF_SELECTABLE);
    */

    // Check to see if the variable accepts user input or not
    if (this.var_.isReadOnly()) {
        this.ui.addClass("non-selectable");
    }
    else {
        this.ui.removeClass("non-selectable");
    }

    // Sign up for notifications from our variable.
    this.var_.addDependent(this);

    // Populate the child widgets

    // Read the name of the variable from the variable itself
    this.fieldName.innerText = this.var_.name();
    this.fieldName.textContent = this.var_.name();

    // Status Icon
    // check for hidden
    if (flags & WIDGET_FLAG.CX3_HIDE_STATUS_ICON) {
        // hide
        this.showIcon(false);
    }
    else {
        this.showIcon(true);
    }

    // check for 'stretched' (alight left, longer field for 'item' text, small font, normal text)
    if (flags & WIDGET_FLAG.CX3_STRETCH_NAME_UNITS) {
        this.ui.addClass("stretch-name");
        this.ui.removeClass("indent-left");
    }
    else {
        this.ui.removeClass("stretch-name");
        // check for indented (grouped variables)

        if (flags & WIDGET_FLAG.CX3_INDENT_LEFT) {
            this.ui.addClass("indent-left");
        }
        else {
            this.ui.removeClass("indent-left");
        }
        /* TODO: is this needed?
        if (flags & WIDGET_FLAG.CX3_INDENT_LEFT) {
          loc.Left += INDENT_LEFT_OFFSET;
          //loc.Right += INDENT_LEFT_OFFSET;
        }
        // check for long variable name
        width = TextWidth(this.var_.name(), this.LargeFontID_);
        if (width > (loc.Right - loc.Left)) {
          //width -= NAME_WIDTH;
          //loc.Right += width;
          loc.Right = loc.Left + width;
        }
        else {
          width = 0;
        }
        */
    }

    /* TODO: is this needed?
    // Value
    // check for long name
    if (width > 0) {
      loc.Left = loc.Right + VALUE_OFFSET;
      loc.Right = VALUE_POS_RIGHT;
    }
    else {
      loc.Left = VALUE_POS_LEFT;
      loc.Right = VALUE_POS_RIGHT;
    }
  
    this.value_.Resize(loc);
    */

    // check for hidden
    if (flags & WIDGET_FLAG.CX3_HIDE_VALUE) {
        // hide
        this.value.hide();
        // set icon for 'selectable' items (e.g. setting)
        if (flags & WIDGET_FLAG.CX3_SELECT_ITEM_ON_ENTER) {
            // Set the icon - hide if not current selection (computed will be set)
            if (this.var_.isComputed()) {
                this.icon_ = "equals";
                this.showIcon(false);
            }
            else {
                this.icon_ = "check";
            }
        }
        // set icon for 'always selected' item (holding pattern turn direction)
        else if (flags & WIDGET_FLAG.CX3_ALLOW_ROTATE_UNIT_ONLY) {
            // Set the icon - always selected
            this.icon_ = "check";
        }
        // set icons for other items with hidden value (e.g. holding pattern entry type)
        else {
            // Set the icon (selectable & holding pattern 'entry' type)
            // NOTE: this assumes read only variable - either 'equals' or 'question mark'
            if (this.var_.isComputed()) {
                if (this.flags_ & WIDGET_FLAG.CX3_CHECK_ON_CALCULATED)
                    this.icon_ = "check";
                else
                    this.icon_ = "equals";
            }
            else
                this.icon_ = "question";
        }
    }
    else {
        // show
        this.value.show();

        // If the variable has a value, polulate the value text.  Otherwise we use the fill text of '--'
        if (this.var_.hasValue() && (this.valueText_ = this.var_.formatValue()).length > 0) {
            // Fill in the text.
            this.userInput_ = this.valueText_;
            this.value.innerText = this.valueText_;
            this.value.textContent = this.valueText_;

            // Set the icon
            if (this.var_.isComputed()) {
                this.icon_ = "equals";
                //this.variableStatusIcon_.SetIcon(BID_STATUS_EQUALS);
            }
            else if (this.var_.isCopied()) {
                this.icon_ = "global";
                //this.variableStatusIcon_.SetIcon(BID_STATUS_GLOBAL);
            }
            else {
                this.icon_ = "check";
                //this.variableStatusIcon_.SetIcon(BID_STATUS_CHECK);
            }
        }
        else {
            // Fill in default text '--'
            this.value.innerText = CONST.UNDEFINED_VAR;
            this.value.textContent = CONST.UNDEFINED_VAR;

            // Set the icon
            this.icon_ = "question";
            //this.variableStatusIcon_.SetIcon(BID_STATUS_QUESTION);
        }
    }

    // Units
    // Check for 'stretched' (item - right justify & longer area, normal text color)
    // check for display as value -adjust position, right justified, larger font, 'value' color
    if (flags & WIDGET_FLAG.CX3_STRETCH_NAME_UNITS) {
        this.ui.removeClass("unit-as-value");
    } else {
        if (flags & WIDGET_FLAG.CX3_DISPLAY_UNIT_AS_VALUE) {
            this.ui.addClass("unit-as-value");
            /*
            loc.Left = VALUE_POS_LEFT;
            loc.Left += width;    //adjust for long name
            loc.Right = VALUE_POS_RIGHT;
            this.units_.AssignFont(this.LargeFontID_);
            this.units_.SetStyle(PM_BORDER_NONE|PM_JUSTIFY_RIGHT|PM_PAINT_TRANS);
            // set as 'value' color unless read-only
            if (!this.var_.isReadOnly())
              this.units_.SetColor(PM_CI_TEXT, CID_VALUE_TEXT);
            */
        }
        else {
            this.ui.removeClass("unit-as-value");
        }
    }
    // Assign text to the units
    this.unit.innerText = this.var_.myPreferredUnit().name();
    this.unit.textContent = this.var_.myPreferredUnit().name();
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Show setting option for variable.
///    NOTE: send a space, " ", for action text if no action text
///
///  @param [in] <_var> <Variable - the variable to display>
///
///  @param [in] <option_text> <string - the option text to display>
///
///  @param [in] <action_text> <string - the action text to display> 
///
///  @param [in] <evt> <event to post when item is 'clicked'>
///
///  @param [in] <param> <parameter to pass with specified event>
///
///  @param [in] <flags> <flags to control position and hiding of child widgets>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.setOption = function (_var, option_text, action_text, evt, param, flags) {
    this.ui.className = this.__defaultClass__;
    // Make sure our variable input is set  
    //assert(_var != 0 );
    this.var_ = _var;

    // Always selectable
    //AddStatus(PM_SF_SELECTABLE);

    // Sign up for notifications from our variable.
    if (!(flags & WIDGET_FLAG.CX3_SETTING_NO_VAR_LINK))
        this.var_.addDependent(this);

    // Set event data & flags
    this.evt_ = evt;
    this.param_ = param;
    this.flags_ = flags;

    // Populate the child widgets
    // TODO: The UI strings should come from the Prism to make internationalization easier?  This could
    //      be saved for future effort...

    // Store option text in field name
    this.fieldName.innerText = option_text;
    this.fieldName.textContent = option_text;

    // Status Icon - set to check
    this.icon_ = "check";

    // check for hidden status icon
    if (flags & WIDGET_FLAG.CX3_HIDE_STATUS_ICON) {
        this.showIcon(false);
    }
    else {
        this.showIcon(true);
        // Set dedault location:
        this.ui.removeClass("indent-left");
    }
    // Value - hide
    this.value.addClass("hidden");

    if (flags & WIDGET_FLAG.CX3_TIMER_ITEM) {
        this.ui.addClass("small-font");
    }
    else {
        this.ui.removeClass("small-font");
    }

    // Favorites - not used, one space at far right edge
    /*
    if (flags & (WIDGET_FLAG.CX3_STRETCH_NAME_UNITS | WIDGET_FLAG.CX3_TIMER_ITEM)) {
      this.ui.addClass("stretch-name");
    }
    else {
      this.ui.removeClass("stretch-name");
    }
    */

    // Units
    // display unit
    this.unit.innerText = action_text;
    this.unit.textContent = action_text;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    The underlying variable has changed.  Figure out what is different and
///    update the display.
///
///  @param [in] <from> <Observable - pointer to the object that is sending the update>
///
///  @param [in] <int> <not used here>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.update = function (from, _) {
    // Make sure that the notification is from our variable
    if (from == this.var_) {
        // Is this a change to the units?
        // check for change in default unit - skip if changing units individually
        if (UnitChange.defaultUnit() != change_individual) {
            // skip if backlight setting variable
            if (this.var_ != Backlight)
                this.var_.checkDefaultUnit();
        }
        if (this.var_.myPreferredUnit().name() != (this.unit.innerText || this.unit.textContent)) {
            this.unit.innerText = this.var_.myPreferredUnit().name();
            this.unit.textContent = this.var_.myPreferredUnit().name();
        }

        // don't update value if user input ignored EXCEPT for aircraft profile items
        if ((this.flags_ & WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS) || (this.flags_ & WIDGET_FLAG.CX3_ALLOW_UNIT_CHANGE_ONLY)) {
            // don't update EXCEPT aircraft profile items (display check when itme is valid)
            if (this.flags_ & WIDGET_FLAG.CX3_CHECK_ON_CALCULATED) {
                // calculated or not
                if (this.var_.isComputed()) {
                    this.icon_ = "check";
                }
                else {
                    this.icon_ = "question";
                }
            }
        }
        // has underlying value changed (value cleared, new default unit, value changed)
        else if (this.var_.hasValue()) {
            // skip text update check for 'selectable' items
            if (!(this.flags_ & WIDGET_FLAG.CX3_SELECT_ITEM_ON_ENTER)) {
                // make sure text matches underlying format
                if (this.var_.hasValue()) {
                    this.valueText_ = this.var_.formatValue();
                    if ((CONST.MAX_VALUE_TEXT_LENGTH + 1) > 0) {
                        // Fill in the text.
                        this.value.innerText = this.valueText_;
                        this.value.textContent = this.valueText_;
                    }
                }
            }

            // calculated or ...
            if (this.var_.isComputed()) {
                // save the value as the input value
                this.userInput_ = this.var_.formatValue();

                this.icon_ = "equals";
            }
            // ... or copied or not?
            else if (this.var_.isCopied()) {
                // save the value as the input value
                this.userInput_ = this.var_.formatValue();

                this.icon_ = "global";
            }
            else {
                this.icon_ = "check";
            }

            // check for seletably hidden status icon
            // seletable: hide icon if 'calculated' (set if another item is selected)
            // TODO: show or hide icon.
            if ((this.flags_ & WIDGET_FLAG.CX3_SELECT_ITEM_ON_ENTER) && (this.var_.isComputed())) {
                this.showIcon(false);
            }
            else {
                this.showIcon(true);
            }
        }
        else {
            // variable has been cleared, we will only display the old input
            // value when the widget has focus
            // set icon to '?'
            this.icon_ = "question";
            // TODO: should this be conditional?
            //if (!(mStyle & PM_PAINT_SELECTED)) {
            this.value.innerText = CONST.UNDEFINED_VAR;
            this.value.textContent = CONST.UNDEFINED_VAR;
            //}
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clear all data assoicated with the widget's underlying variable
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.clearVariable = function () {
    if (this.var_ != null) {
        // disconnect from our variable
        this.var_.removeDependent(this);

        // clear 'use default units' (used to change all units of same type on screen)
        this.var_.setUseDefaultUnit(false);

        // clear the pointer
        this.var_ = null;

        // clear event
        this.evt_ = this.param_ = 0;
    }

    // clear input data
    this.clearInput();
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clear out user input and any associated text on screen.
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.clearInput = function () {
    // set status icon to ?
    this.icon_ = "question";

    // clear this.value_
    this.value.innerText = CONST.UNDEFINED_VAR;
    this.value.textContent = CONST.UNDEFINED_VAR;

    // Clear out the text buffers
    this.valueText_ = "";
    this.userInput_ = "";
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Widget has lost focus.  Process any user input and pass to underlying
///    variable.
///
///  @param [in] <Event> <Keypad push event data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.OnEventLostFocus = function (Event) {
    var setDirty = false;

    //  // always pass system events to base class 
    //  CX3ListItemBaseWidget::OnEventLostFocus(Event);

    // skip all processing if calculator memory active (process on return)
    if (!CX3Calculator.CalculatorMemoryActive) {
        // Is calculator active?
        if (CX3Calculator.CalculatorActive) {
            // Check for valid calculator function and value (calculator will set CX3Calculator.CalculatorOutputReady accordingly)
            CX3Calculator.CalculatorCheckForOutput();

            if (!CX3Calculator.CalculatorOutputReady) {
                // Reset value text - new input handled below
                if (!this.dirty_) {
                    this.value_.innerText = this.userInput_;
                    this.value_.textContent = this.userInput_;
                }

            }
            else {
                // send signal to update (clock) setting
                setDirty = true;

                var hms_or_dms = false;
                if (this.var_.specialFormat() >= FORMAT.DMS) {
                    hms_or_dms = true;
                }

                // Check for new user input (value cleared)
                if (this.var_.hasNoValue()) {
                    this.var_.setValueFromString(this.userInput_);
                }

                // Get calculator output - use displayed (preferred unit) value
                var calcValue = this.var_.valueInPreferredUnits();
                calcValue = CX3Calculator.CalculatorReturnOutput(calcValue, hms_or_dms);

                // check for calculator error
                if (CX3Calculator.CalculatorError) {
                    // clear input text
                    this.clearInput();

                    // clear variable
                    this.var_.clearValue();

                    // display 'no value'
                    this.value_.innerText = CONST.UNDEFINED_VAR;
                    this.value_.textContent = CONST.UNDEFINED_VAR;
                }
                else {
                    // treat as new value (and notify dependents that value cleared)
                    this.var_.clearValue();

                    // set from calculator output - value in preferred units
                    this.var_.convertValue(calcValue);

                    this.dirty_ = false;
                    // set flag to clear input on next valid input event
                    this.clearUserInput_ = true;

                    // re-set user input to correct precision
                    // TODO: format user input but do not truncate to 0-2 decimal places
                    this.formatUserInput(calcValue, hms_or_dms);
                }

                // clear calculator function & input
                CX3Calculator.CalculatorClearFunction();
            }
        }

        // Has a value been entered?
        if (this.dirty_) {
            // if the string is not empty, transfer the displayed value to 
            // the underlying variable.    
            if (this.userInput_.length > 0) {
                // make sure the variable is unlocked so we can update the value.
                this.var_.setLock(false);
                this.var_.setValueFromString(this.userInput_);
            }
        }
        else if (this.var_.hasNoValue() && this.var_.hasLastValue()) {
            // the underlying variable doesn't have a value, but there is
            // some old input.  In this case we only show the old input
            // when the widget has focus
            this.value.innerText = CONST.UNDEFINED_VAR;
            this.value.textContent = CONST.UNDEFINED_VAR;
        }

        // set flag to clear input on next valid input event
        this.clearUserInput_ = true;

    }

    // send with no user input to reset last value
    if (this.flags_ & WIDGET_FLAG.CX3_SEND_EVT_DIRTY_OR_NOVALUE) {
        // send event if dirty OR variable has no value
        if (this.dirty_ || setDirty || this.var_.hasNoValue()) {
            // pass event up to parent
            this.owner.post(this.evt_, { source: this, param: this.param_ });
        }
    }

    this.dirty_ = false;

    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Widget has gained focus (e.g. is selected and input will be directed ///    here).
///
///  @param [in] <Event> <Keypad push event data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.OnEventGainedFocus = function (Event) {
    var val;

    // always pass system events to base class 
    //CX3ListItemBaseWidget::OnEventGainedFocus(Event);       

    // Check for CX3Calculator.Calculator memory active
    if (CX3Calculator.CalculatorMemoryActive) {
        var hms_or_dms = this.var_.special_format() >= FORMAT.DMS;

        // Check for new user input (value cleared)
        if (this.var_.hasNoValue()) {
            this.var_.setValueFromString(this.userInput_);
        }

        // Get calculator output - use displayed (preferred unit) value
        val = this.var_.valueInPreferredUnits();
        val = CX3Calculator.CalculatorReturnOutput(val, hms_or_dms);

        // check for calculator error
        if (CX3Calculator.CalculatorError) {
            //divide by zero or other calculator error - treat as value cleared
            // clear input text
            this.clearInput();

            // clear variable
            this.var_.clearValue();

            // display 'no value'
            this.value.innerText = CONST.UNDEFINED_VAR;
            this.value.textContent = CONST.UNDEFINED_VAR;
        }
        else {

            //TODO: rest of processing (depending on calculator status & output)
            // treat as new value (and notify dependents that value cleared)
            this.var_.clearValue();

            // set from calculator output - value in preferred units
            this.var_.convertValue(val);

            this.dirty_ = false;
            // set flag to clear input on next valid input event
            this.clearUserInput_ = true;

            // re-set user input to correct precision
            // TODO: format user input but do not truncate to 0-2 decimal places
            this.formatUserInput(val, hms_or_dms);
        }
    }
    // check for value recalled from memory
    else if (MemInputOne.valRecalled) {
        // ignore if read-only (should not be processed by memory function)
        if (!this.var_.isReadOnly()) {
            // Change value to basic units before setting new value
            val = this.var_.myPreferredUnit().convertToDefault(MemInputOne.val);
            this.var_.clearValue();    //clear value for proper update of other variables
            this.var_.setValue(val);
            // Update value text (user text set by memory function)
            this.valueText_ = this.var_.formatValue();
        }
    }
    // clock set - check for memory function called with new user input (set entered time for proper operation)
    if (this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED) {
        // user input when memory function pressed - send event for proper clock and UTC/local/dest time update
        var idx = this.userInput_.length;
        if (MemInputOne.hasValue && (idx > 0)) {
            MemInputOne.valRecalled = true;
        }

        // clear memory to prevent multiple clock settings
        MemInputOne.hasValue = false;
    }
    // clock set - value recalled from memory (or calc function value) - send event to set new time
    if (CX3Calculator.CalculatorMemoryActive || MemInputOne.valRecalled) {
        if (this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED) {
            // pass event up to parent
            this.owner.post(this.evt_, { source: this, param: this.param_ });
        }

        MemInputOne.valRecalled = false;
    }

    if (this.var_.hasNoValue() && this.var_.hasLastValue() && !this.var_.isReadOnly()) {
        // Don't show previous value if calculator error
        if (!CX3Calculator.CalculatorError) {
            // the variable doesn't have a current value, but there is
            // a previous value.  In this case we show the old value just
            // when the widget has focus    
            this.valueText_ = this.var_.formatLastValue();
            this.userInput_ = this.valueText_;
            this.value.innerText = this.valueText_;
            this.value.textContent = this.valueText_;
        }
    }

    // clear calculator function
    CX3Calculator.CalculatorClearFunction();

    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Handle key push events from the user.
///
///  @param [in] <Event> <Keypad push event data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.OnEventKeypadPush = function (evt) {
    var calcValue;
    var prefUnit;

    // process memory function key LAST
    // TODO: what if calculator function active?
    if (evt.keyName == CONST.CX3_KEY.MEMORY) {
        // TODO: send memory function key to calculator here or below?
    }
    else {
        // always pass system events to base class (memory function key sent below Pm_Widget::OnEventKeypadPush(evt);        
    }
    // ignore favorite key & back key (main may unlink or clear this variable)
    if ((evt.keyName == CONST.CX3_KEY.FAVS) || (evt.keyName == CONST.CX3_KEY.BACK))
        return 0;

    // check for new event to send
    // make sure this is a key that we care about
    var send_event = false;

    if ((evt.keyName == CONST.CX3_KEY.ENTER) &&
        ((this.evt_ == CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED) ||
            (this.evt_ == CX3_WIDGET_EVENT.EQSCREEN_ITEM_PREVIOUS))) {
        // check for valid add/remove event
        if (this.var_.myPreferredUnit() != item_noText) {
            // change units
            this.var_.rotatePreferredUnit(false);
            // 'no text' not valid here
            if (this.var_.myPreferredUnit() == item_noText)
                this.var_.rotatePreferredUnit(false);

            // pass event up to parent
            send_event = true;
            //evt.handled = true;
            this.evt_ = CX3_WIDGET_EVENT.EQSCREEN_ITEM_CHANGED;
        }
    }
    else if ((evt.keyName == CONST.CX3_KEY.UP_ARROW) && (this.evt_ == CX3_WIDGET_EVENT.EQSCREEN_ITEM_PREVIOUS)) {
        // pass event up to parent
        send_event = true;
        //evt.handled = true;
    }
    else if ((evt.keyName == CONST.CX3_KEY.DOWN_ARROW) && (this.evt_ == CX3_WIDGET_EVENT.EQSCREEN_ITEM_NEXT)) {
        // pass event up to parent
        send_event = true;
        //evt.handled = true;
    }
    else if ((evt.keyName == CONST.CX3_KEY.ENTER) &&
        ((this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED) || (this.evt_ == CX3_WIDGET_EVENT.SETTING_SELECTED))) {
        // pass event up to parent
        send_event = true;
        //evt.handled = true;
    }
    // New clock time entered via up/down key 
    // NOTE: only option allowing user input is currently clock time 
    // TOOD: new event if other setting allow user input
    else if ((this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED)) {
        if ((this.dirty_ == true) && ((evt.keyName == CONST.CX3_KEY.UP_ARROW) || (evt.keyName == CONST.CX3_KEY.DOWN_ARROW))) {
            send_event = true;
            //evt.handled = true;
        }

        if ((evt.keyName == CONST.CX3_KEY.EQUALS) && ((this.dirty_ == true) || (CalculatorActive == true))) {
            send_event = true;
            //evt.handled = true;
        }
    }
    else if (((evt.keyName == CONST.CX3_KEY.SET_UNIT) || (evt.keyName == CONST.CX3_KEY.CONV_UNIT)) && (this.evt_ == CX3_WIDGET_EVENT.SET_DEFAULT_UNIT)) {
        // pass event up to parent
        send_event = true;
        //evt.handled = true;
    }

    if (send_event == true) {
        // TODO: check if this needs to execute after everything else.
        // pass event up to parent
        //this.owner.fire(this.evt_, { param : this.param_ });
        this.owner.post(this.evt_, { param: this.param_ });
    }

    // If this is a read-only variable, there is nothing to do...
    //  ....except allow 'conv unit' to change units & memory function key
    if (this.var_.isReadOnly() && (evt.keyName != CONST.CX3_KEY.CONV_UNIT) && (evt.keyName != CONST.CX3_KEY.MEMORY)) {
        //evt.handled = true;
        return;
    }

    // Check for 'allow rotate unit only' processing (turn unit direction)
    if (this.flags_ & WIDGET_FLAG.CX3_ALLOW_ROTATE_UNIT_ONLY) {
        // rotate unit (change turn direction) on enter, conv unit, or set unit
        if ((evt.keyName == CONST.CX3_KEY.ENTER) || (evt.keyName == CONST.CX3_KEY.SET_UNIT) || (evt.keyName == CONST.CX3_KEY.CONV_UNIT)) {
            this.var_.rotatePreferredUnit(false);
            evt.handled = true;
        }
        return 0;
    }

    // Check for 'enter key only' processing
    if ((this.flags_ & WIDGET_FLAG.CX3_IGNORE_KEYS_EXCEPT_ENTER) && (evt.keyName != CONST.CX3_KEY.ENTER)) {
        return 0;
    }

    // Check for ignore non-event keys (event processed above)
    if (this.flags_ & WIDGET_FLAG.CX3_IGNORE_NON_EVENT_KEYS) {
        return 0;
    }

    // Option Select: Ignore set/conv unit
    if (this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED) {
        if ((evt.keyName == CONST.CX3_KEY.SET_UNIT) || (evt.keyName == CONST.CX3_KEY.CONV_UNIT)) {
            return 0;
        }
    }
    // Check for process unit change keys only
    if (this.flags_ & WIDGET_FLAG.CX3_ALLOW_UNIT_CHANGE_ONLY) {
        if ((evt.keyName != CONST.CX3_KEY.SET_UNIT) && (evt.keyName != CONST.CX3_KEY.CONV_UNIT))
            return 0;
    }

    var idx = this.userInput_.length;
    var key = evt.keyName;
    var hms_or_dms = false;
    var spec_format = this.var_.specialFormat();
    if (spec_format >= FORMAT.DMS) {
        hms_or_dms = true;
    }

    // if we have a value or user input, send key to calculator 1st for processing
    // calculator will clear key or return key required for further processing
    if ((idx > 0) || this.var_.hasValue()) {
        key = CX3Calculator.CalculatorProcessKey(evt.keyName, hms_or_dms);
    }

    // Check calculator for output ready or change in value/function
    if (CX3Calculator.CalculatorChanged == true) {
        // Make sure full HMS string is shown
        if (hms_or_dms == true) {
            calcValue = calculateValueFromHmsString(this.userInput_);
            // check for user input out of range 
            if (calcValue > CONST.MAX_HMS_HOURS)
                calcValue = CONST.MAX_HMS_HOURS;
            else if (calcValue < -CONST.MAX_HMS_HOURS)
                calcValue = -CONST.MAX_HMS_HOURS;

            this.userInput_ = formatHmsValue(calcValue, true);
        }
        this.value.innerText = CX3Calculator.CalculatorReturnFullText(this.userInput_, (CONST.MAX_VALUE_TEXT_LENGTH + 1));
        this.value.textContent = CX3Calculator.CalculatorReturnFullText(this.userInput_, (CONST.MAX_VALUE_TEXT_LENGTH + 1));
    }
    if (CX3Calculator.CalculatorOutputReady == true) {
        // Check for new user input (value cleared)
        if (this.var_.hasNoValue())
            this.var_.setValueFromString(this.userInput_);

        // Get calculator output - use displayed (preferred unit) value
        calcValue = this.var_.valueInPreferredUnits();
        calcValue = CX3Calculator.CalculatorReturnOutput(calcValue, hms_or_dms);

        // check for calculator error
        if (CX3Calculator.CalculatorError == true) {
            //divide by zero or other calculator error - treat as value cleared
            key = CONST.CX3_KEY.CLEAR;
        }
        else {
            // treat as new value (and notify dependents that value cleared)
            this.var_.clearValue();

            // set from calculator output - value in preferred units
            this.var_.convertValue(calcValue);

            this.dirty_ = false;
            // set flag to clear input on next valid input event
            this.clearUserInput_ = true;

            // format user input
            this.formatUserInput(calcValue, hms_or_dms);
            // clear key
            key = 0;

            // send 'roll on enter' event 
            // TODO: is this needed?
            this.owner.post("cx3-roll-on-enter", { source: this });
        }

        // clear calculator function & input
        CX3Calculator.CalculatorClearFunction();
    }

    // make sure this is a key that we care about
    if (key == CONST.CX3_KEY.BACKSPACE) {
        // Are the characters to delete?
        if (idx > 0) {
            if (hms_or_dms == true) {
                this.userInput_ = CX3Calculator.FormatHMSuserInput(this.userInput_, key, false);
                idx = this.userInput_.length;
            }
            else {
                this.userInput_ = this.userInput_.slice(0, -1);
                idx--;
            }
            // If the string is not empty now, then write it to screen
            // else write the undefined prompt.
            if (idx > 0) {
                this.value.innerText = this.userInput_;
                this.value.textContent = this.userInput_;
            }
            else {
                this.value.innerText = CONST.UNDEFINED_VAR;
                this.value.textContent = CONST.UNDEFINED_VAR;
            }

            // no need to clear text input now as this is considered a valid change
            this.clearUserInput_ = false;

            this.var_.clearValue();

            // we need to update the underlying variable when the appropriate events
            // take place.
            this.dirty_ = true;
        }
    }
    // plus/minus
    else if (key == CONST.CX3_KEY.PLUS_MINUS) {
        // check for new user input
        if (this.dirty_) {
            // Is there user input?
            if (idx > 0) {
                // Toggle +/-:
                if (this.userInput_[0] == "-") {
                    this.userInput_ = this.userInput_.slice(1);
                }
                else {
                    this.userInput_ = "-" + this.userInput_;
                }

                // assign the text to the UI element
                this.value.innerText = this.userInput_;
                this.value.textContent = this.userInput_;
                evt.handled = true;
            }
        }
        else if (this.var_.hasValue()) {
            // calculate value
            // NOTE: using value instead of string to avoid processing HMS/DMS input strings
            calcValue = this.var_.value();
            prefUnit = this.var_.myPreferredUnit();
            calcValue = prefUnit.convert(calcValue);
            calcValue = -calcValue;
            calcValue = prefUnit.convertToDefault(calcValue);
            // clear variable for proper updates to linked equation outputs and inputs.
            this.var_.clearValue();
            // set new value
            this.var_.setValue(calcValue);
            // re-set user input to match new value
            this.userInput_ = this.valueText_;
            evt.handled = true;
        }
    }
    // square root
    else if (key == CONST.CX3_KEY.SQUARE_ROOT) {
        // skip if HMS or DMS input
        if (this.var_.specialFormat() < FORMAT.DMS) {
            // check for new user input
            if (this.dirty_) {
                // Is there user input?
                if (idx > 0) {
                    // make sure the variable is unlocked so we can update the value.
                    this.var_.setLock(false);
                    this.var_.setValueFromString(this.userInput_);

                    this.dirty_ = false;

                    // set flag to clear input on next valid input event
                    this.clearUserInput_ = true;
                    // square root calculated below
                }
            }
            // calculate square root
            if (this.var_.hasValue()) {
                // NOTE: using value instead of string to avoid processing HMS/DMS input strings
                calcValue = this.var_.value();
                prefUnit = this.var_.myPreferredUnit();
                calcValue = prefUnit.convert(calcValue);
                // check for error (sqare root of negative number)
                if (calcValue < 0) {
                    // clear variable value
                    this.var_.clearValue();
                    // clear input text
                    this.clearInput();
                }
                else {
                    calcValue = Math.sqrt(calcValue);
                    // format user input
                    this.formatUserInput(calcValue, hms_or_dms);

                    // convert back to basic units
                    calcValue = prefUnit.convertToDefault(calcValue);
                    // clear variable for proper updates to linked equation outputs and inputs.
                    this.var_.clearValue();
                    // set new value
                    this.var_.setValue(calcValue);
                }
            }
            evt.handled = true;
        }
    }
    else if ((key == CONST.CX3_KEY.ENTER) || (key == CONST.CX3_KEY.EQUALS) || (key == CONST.CX3_KEY.MEMORY)) {
        // check for 'selectable' item
        if (this.flags_ & WIDGET_FLAG.CX3_SELECT_ITEM_ON_ENTER) {
            // make sure the variable is unlocked so we can update the value.
            this.var_.setLock(false);
            // set value to '1.0' for proper procesing (set as check, hide other selection icons)
            this.var_.setValue(1.0);
        }
        // has new data been entered or does the UI has a value, but the 
        // underlying variable does not. The latter happens when one or 
        // more of the variables has been changed after a calcuation.  
        // The underlying data is cleared, but we retain the values so 
        // they can be changed or re-entered.
        else if (this.dirty_ || this.var_.hasNoValue()) {
            // if the string is not empty, transfer the displayed value to 
            // the underlying variable.    
            if (this.userInput_.length > 0) {
                // don't 'enter' last value on 'memory function' key if no user input
                if (this.dirty_ || (key != CONST.CX3_KEY.MEMORY)) {
                    // make sure the variable is unlocked so we can update the value.
                    this.var_.setLock(false);
                    this.var_.setValueFromString(this.userInput_);

                    // re-format user input (catches HMS user input > max value)
                    this.formatUserInput(this.var_.value(), hms_or_dms);


                    // settings - new clock time set w/memory function key 
                    // - send update to update clock and UTC/local/dest times
                    if ((key == CONST.CX3_KEY.MEMORY) && (this.evt_ == CX3_WIDGET_EVENT.OPTION_SELECTED)) {
                        // pass event up to parent
                        // TODO: is this needed?
                        this.owner.post(this.evt_, { source: this, param: this.param_ });
                    }

                    if (key != CONST.CX3_KEY.MEMORY) {
                        // send 'roll on enter' event 
                        this.owner.post("cx3-roll-on-enter", { source: this, param: 0 });
                    }

                }
            }

            this.dirty_ = false;

            // set flag to clear input on next valid input event
            this.clearUserInput_ = true;

        }
        //evt.handled = true;
    }
    else if (key == CONST.CX3_KEY.CLEAR) {
        // clear input text
        this.clearInput();

        // clear variable
        this.var_.clearValue();

        this.dirty_ = false;

        // set flag to clear input on next valid input event
        this.clearUserInput_ = true;

        evt.handled = true;
    }
    // process 'set unit' and 'convert unit' keys
    else if ((key == CONST.CX3_KEY.SET_UNIT) || (key == CONST.CX3_KEY.CONV_UNIT)) {
        // 'set unit': set flag to clear variable calculated indication
        var clear_calc = false;
        if (key == CONST.CX3_KEY.SET_UNIT)
            clear_calc = true;

        // convert unit 
        if (key == CONST.CX3_KEY.CONV_UNIT) {
            // save new user input before conversion
            if (this.dirty_ == true) {
                // if the string is not empty, transfer the displayed value to 
                // the underlying variable.    
                if (this.userInput_.length > 0) {
                    // make sure the variable is unlocked so we can update the value.
                    this.var_.setLock(false);
                    this.var_.setValueFromString(this.userInput_);
                }
                else if (this.var_.hasLastValue()) {
                    // no new input, but there is an old value
                    this.var_ = this.var_.lastValue();
                    // reset user input to old value
                    this.userInput_ = this.valueText_;
                }
            }

            //only update if default unit can be changed
            // set new default unit
            if (this.var_.rotatePreferredUnit(clear_calc)) {
                // If the variable has a value, polulate the value text.
                if (this.var_.hasValue()) {
                    this.valueText_ = this.var_.formatValue();
                    if (this.valueText_ > 0) {
                        // Fill in user input text.
                        // NOTE: this will be formatted to set precision
                        // TODO: adjust to last input length (remove zeros/ decimal or show more digits)??
                        this.userInput_ = this.valueText_;
                    }
                }
                // else if NOT read only, 
                else if (this.var_.isReadOnly() == false) {
                    //  populate last value text
                    this.valueText_ = this.var_.formatLastValue();

                    if (this.valueText_ > 0) {
                        // Fill in the text.
                        this.userInput_ = this.valueText_;
                        this.value.innerText = this.valueText_;
                        this.value.textContent = this.valueText_;
                    }
                }
            }
        }
        //set unit - clear variable and reset from user input
        else {
            //only update if default unit can be changed
            // set new default unit
            if (this.var_.rotatePreferredUnit(clear_calc)) {
                // if the string is not empty, clear value to update all variables
                //  & reset value text
                if (this.userInput_.length > 0) {
                    // clear value to clear any calculations using this variable
                    this.var_.clearValue();

                    // make sure the variable is unlocked so we can update the value.
                    this.var_.setLock(false);
                    this.var_.setValueFromString(this.userInput_);
                }
            }
        }
        // clear dirty (if new input) 
        this.dirty_ = false;

        // set flag to clear input on next valid input event
        this.clearUserInput_ = true;

        evt.handled = true;
    }
    else if (CONST.CHAR_KEYS.indexOf(key) != -1) {
        // Some other ASCII value.  Convert and see if we need to handle it.  
        var c = key[0];

        // make sure we don't have two decimal points in the string
        if (c == CONST.CX3_KEY.DECIMAL && this.clearUserInput_ == false) {
            if (this.userInput_.indexOf('.') != -1) {
                evt.handled = true;
                return;
            }
        }

        // only allow colon if variable unit format is HMS or DMS
        if (c == CONST.CX3_KEY.COLON && hms_or_dms == false) {
            evt.handled = true;
            return 0;
        }

        if ((c >= '0' && c <= '9') || c == '.' || c == ':') {
            // if this is a new input event, clear previous text
            if (this.clearUserInput_ == true) {
                this.userInput_ = "";
                idx = 0;
                this.clearUserInput_ = false;

                this.var_.clearValue();
            }

            // Character is valid, insert into input buffer (if there is room)

            // limit Runway to 2 digits
            // TODO: limit other units? (such as angles), here or set max length in widet setup?
            if ((this.var_.myPreferredUnit() == runway_deca_degrees) && (idx >= 2)) {
                evt.handled = true;
                return 0;
            }

            if (hms_or_dms == true) {
                this.userInput_ = CX3Calculator.FormatHMSuserInput(this.userInput_, key, false);
                idx = this.userInput_.length;

                // assign the text to the UI element
                this.value.innerText = this.userInput_;
                this.value.textContent = this.userInput_;

                // we need to update the underlying variable when the appropriate events
                // take place.
                this.dirty_ = true;
            }
            else if (idx < (CONST.MAX_VALUE_TEXT_LENGTH >> 1)) {
                this.userInput_ += c;

                // assign the text to the UI element
                this.value.innerText = this.userInput_;
                this.value.textContent = this.userInput_;

                // we need to update the underlying variable when the appropriate events
                // take place.
                this.dirty_ = true;
            }
        }
    }

    // process memory function key & send up 
    if (key == CONST.CX3_KEY.MEMORY) {
        // Set memory input 1
        if (this.var_.hasValue()) {
            MemInputOne.hasValue = true;
            var tmp = this.var_.value();
            MemInputOne.val = this.var_.myPreferredUnit().convert(tmp);
            // format user input
            this.formatUserInput(MemInputOne.val, hms_or_dms);
        }
        else {
            // Clear memory input 1
            MemInputOne.hasValue = false;
            MemInputOne.val = CONST.NO_VALUE;
        }
        // set text pointer for memory recall or store
        MemInputOne.text = this.userInput_;
        // set format type
        MemInputOne.hms_or_dms = hms_or_dms;
        // don't allow recall if read-only variable
        if (this.var_.isReadOnly()) {
            MemInputOne.allowRecall = false;
        }
        else {
            MemInputOne.allowRecall = true;
        }
        MemInputOne.valRecalled = false;

        // indicate memory inputs set/cleared
        MemInputOne.valSet = true;

    }

    if ((key == CONST.CX3_KEY.MEMORY) || (CX3Calculator.CalculatorMemoryActive == true)) {
        // always pass system events to base class 
        // TODO: Is this needed?
        //Pm_Widget::OnEventKeypadPush(evt);        

    }
    return 0;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Format user input with value
///
///  @param [in] <value_t> <value to copy to this.userInput_ and format>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorFieldWidget.prototype.formatUserInput = function (val, format_hms) {
    var temp;
    var idx;

    // HMS or DMS - use saved value in this.var_
    if (format_hms == true)
        this.userInput_ = this.var_.formatValue();
    // decimal - use new value (in prefred units)
    else {
        temp = val.toString();
        // Is the string too long?
        if (temp.length > CONST.MAX_CHARACTERS) {
            // Can the precision be shortened?
            idx = temp.indexOf('.');
            // Make sure the decimal is visible and not the last character:
            if (idx < (CONST.MAX_CHARACTERS - 1)) {
                // Create the string with the correct number of decimal digits:
                temp = val.toFixed(CONST.MAX_CHARACTERS - idx - 1);
            }
            else {
                // Too big, must use exponetial value:
                temp = val.toExponential(1);
            }
        }
        this.userInput_ = temp;
    }
    //this.calcText_.AssignText(this.userInput_);
}
