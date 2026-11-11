///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  
//  Class Name: calculatorScreen
//  
//   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//  
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: mike $
// @version $Rev: 402 $
// @date    $Date: 2011-06-07 07:39:44 -0700 (Tue, 07 Jun 2011) $
// @brief   used to display calculator function screen 
////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
#include "prism_includes.h"
#include "calculator.h"
#include "CX3_UI_res.h"
#include "calculatorScreen.h"
#include "widgetIDs.h"
#include "calc_utility.h"
#include "math.h"
#include <string.h>

// Fix name issues with EWL
#ifdef _EWL_STRING_H
#define strnlen strnlen_s
#endif

namespace CX3_UI {

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
pm_event_table_entry calculatorScreenEvents[] = {

{ PM_EVENT_HIDE,                PM_EVENT_HANDLER(&calculatorScreen::OnEventHide)},
{ PM_EVENT_KEYPAD_PUSH,              PM_EVENT_HANDLER(&calculatorScreen::OnEventKeypadPush)},
{ CX3_PRISM_EVENT_CALCULATOR_OUTPUT_READY,    PM_EVENT_HANDLER(&calculatorScreen::OnEventOutputReady)},
{ 0, NULL}   // array terminator
};
;
*/

CONST.MAX_CALCULATOR_ITEMS = 9;

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default calculatorScreen panel and creates the children.  Memory
///    is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <Display size for this panel>
///
////////////////////////////////////////////////////////////////////////////////
function CalculatorScreen() {
    Panel.call(this);
    this.title = "CALCULATOR";

    this.output_ = false;
    this.firstInput_ = false;

    this.calculator_items_ = new Array(CONST.MAX_CALCULATOR_ITEMS);
    // Create the variable container widgets and add to the list
    for (var i = 0; i < this.calculator_items_.length; i++) {
        this.calculator_items_[i] = new CX3CalculatorWidget();
    }

    // Add the events:
    //this.addEvent(PM_EVENT_HIDE, this.OnEventHide);
    this.addEvent("cx3-keypress", this.OnEventKeypadPush);
    this.addEvent(CX3_WIDGET_EVENT.CALCULATOR_OUTPUT_READY, this.OnEventOutputReady);
    this.addEvent("cx3-keypress", Panel.EVENTS.DEFAULT_NAVIGATION);
}
// CalculatorScreen is a subclass of Panel:
CalculatorScreen.inheritsFrom(Panel);

/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
calculatorScreen::~calculatorScreen() {
for (unsigned int i = 0; i < ARRAY_SIZE(this.calculator_items_); i++) {
Destroy(this.calculator_items_[i]);
}

// takes care of the list
Destroy(this.calculatorList_);
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
pm_int_t CalculatorScreen.prototype.Notify = function(const pm_event_t &Event) {
pm_event_table_entry *pEventList = calculatorScreenEvents;

while(pEventList.EventType) {
if (pEventList.EventType == Event.Type) {
if (pEventList.Handler == NULL) {
return 0;
}
return PM_CALL_EVENT_HANDLER(*this, pEventList.Handler)(Event);
}
pEventList++;
}

return Pm_Panel::Notify(Event);
}
 */

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Displays the Calculator function screen
///
///
////////////////////////////////////////////////////////////////////////////////
CalculatorScreen.prototype.ShowCalculator = function () {
    // make sure that we've allocated our memory
    //assert(this.calculator_items_ != NULL);

    // Clear the widget list
    this.clearListData();

    // Fill in list
    for (var i = 0; i < (CONST.MAX_CALCULATOR_ITEMS - 1); i++) {
        // send a single space as calculator text (so widget text pointer has something to point at)
        this.AddItem(" ", i);
    }
    // ititialize calculator text = "0"
    this.AddItem("0", (CONST.MAX_CALCULATOR_ITEMS - 1));

    // Set focus
    //this.calculatorList_.SetSelected(CONST.MAX_CALCULATOR_ITEMS - 1);
    this.activeChild = this.children_[this.children_.length - 1];

    // Indicate 1st input & not an output
    this.firstInput_ = true;
    this.output_ = false;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       add a new item to the list.  No check for duplicates is made
///
///  @param [in] <text> <text to show for new list item>
///
///  @param [in] <item> <item number>
///
///  @return <true if there was room in the list, false otherwise>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorScreen.prototype.AddItem = function (text, item) {
    var active_line;

    // check if item number in range
    if (item <= CONST.MAX_CALCULATOR_ITEMS) {
        // last item is active line in calculator
        if (item == (CONST.MAX_CALCULATOR_ITEMS - 1))
            active_line = true;
        else
            active_line = false;

        // set text & clear HMS format
        this.calculator_items_[item].Set(text, active_line);
        this.calculator_items_[item].format_hms = false;

        this.addChild(this.calculator_items_[item]);

        return true;
    }
    return false;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///       Clear items and remove them from list (but don't delete them).
///
////////////////////////////////////////////////////////////////////////////////
CalculatorScreen.prototype.clearListData = function() 
{   
    for (var i = 0; i < this.calculator_items_.length; i++) {
        //assert(this.calculator_items_[i] != NULL);
        this.calculator_items_[i].Clear();
        this.removeChild(this.calculator_items_[i]);
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process 'calculator output ready' event  
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorScreen.prototype.OnEventOutputReady = function (Event) {
    var calc_text;
    var i;
    var val;
    var text;
    var buf = ""; //[20];

    // Move all items up 1 row 
    for (i = 0; i < (CONST.MAX_CALCULATOR_ITEMS - 1); i++) {
        // copy calc text from next item
        calc_text = this.calculator_items_[(i + 1)].CalcText();
        this.calculator_items_[i].SetCalcText(calc_text);

        // and value & format
        val = this.calculator_items_[(i + 1)].GetValue();
        this.calculator_items_[i].SetValue(val);
        this.calculator_items_[i].format_hms = this.calculator_items_[(i + 1)].format_hms;

        // and user input (used to display value by memory function)
        text = this.calculator_items_[(i + 1)].UserText();
        this.calculator_items_[i].SetUserText(text);
    }
    // check for memory recall with active line currently calculator output
    if (MemInputOne.valRecalled == true) {
        // re-set user input to display text (last line - output)
        calc_text = this.calculator_items_[(i - 1)].CalcText();
        this.calculator_items_[i - 1].SetUserText(calc_text);
        this.output_ = false;

        // set display text and value from user input (recalled memory value)
        text = this.calculator_items_[i].UserText();
        this.calculator_items_[i].SetCalcText(text);
        val = MemInputOne.val;
        this.calculator_items_[i].SetValue(val);
        MemInputOne.valRecalled = false;

    }
    // square root (1st input) or calculator output ready
    else {
        var error = false;
        var valid = false;    // set true if valid 2nd calculator function

        // indicate active line is output
        this.output_ = true;

        // check for square root on 1st input
        // also used to display error if unit set/change to HMS with |val| >= 1000 hrs
        if (Event.param == CONST.CX3_KEY.SQUARE_ROOT) {
            // get current value
            val = this.calculator_items_[i].GetValue();

            // check for error (can't take square root of negative number)
            if (val < 0) {
                // clear user text & value
                buf = "";
                this.calculator_items_[i].SetUserText(buf);
                val = CONST.NO_VALUE;
                this.calculator_items_[i].SetValue(val);

                // display "Error" 
                this.calculator_items_[i].SetCalcText("Error");

                error = true;
            }
            else {
                // calculate square root & update user input & display text
                val = Math.sqrt(val);
                buf = val.toString();
                this.calculator_items_[i].SetValue(val);
                this.calculator_items_[i].SetUserText(buf);
                this.calculator_items_[i].SetCalcOutputText();
            }
        }
        else {
            // Calculator output ready - get & store output value
            if (DEBUG) {
                console.log("Calculator output ready - get & store output value");
            }
            val = CX3Calculator.CalculatorReturnOutput(this.calculator_items_[i].GetValue(), this.calculator_items_[i].format_hms);
            this.calculator_items_[i].SetValue(val);

            // Check for calculator error
            if (CX3Calculator.CalculatorError == true) {
                buf = "";
                this.calculator_items_[i].SetUserText(buf);

                if (DEBUG) {
                    console.log("display error");
                }

                // display "Error" 
                this.calculator_items_[i].SetCalcText("Error");

                error = true;
            }

            // Store calculator value
            text = CX3Calculator.CalculatorReturnValueText();
            // check for error
            if (text == "") {
                // clear user text & value - calculator value & output
                val = CONST.NO_VALUE;
                this.calculator_items_[i - 1].SetUserText(text);
                this.calculator_items_[i - 1].SetValue(val);
                this.calculator_items_[i].SetUserText(text);
                this.calculator_items_[i].SetValue(val);

                // display "Error" 
                this.calculator_items_[i].SetCalcText("Error");

                error = true;
            }
            else {
                this.calculator_items_[i - 1].SetUserText(text);
                this.calculator_items_[i - 1].SetValue(CX3Calculator.CalculatorValue);
            }

            // set calculator output text
            if (error == false) {
                this.calculator_items_[i].SetTextFromVal();

                // save calculator next function
                var next = CX3Calculator.CalculatorNextFunction;
                // clear calculator function & input
                CX3Calculator.CalculatorClearFunction();

                // check for valid next function
                valid = CX3Calculator.CalculatorSetFunction(next);
            }

        }
        // if valid, move all items up one row & update active line text
        if ((valid == true) || (error == true)) {

            // no longer an output from calculator or first input
            this.output_ = false;
            this.firstInput_ = false;
            this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetOutput(false);

            // Move all items up 1 row 
            for (i = 0; i < (CONST.MAX_CALCULATOR_ITEMS - 1); i++) {
                // copy calc text from next item
                calc_text = this.calculator_items_[(i + 1)].CalcText();
                this.calculator_items_[i].SetCalcText(calc_text);

                // and value
                val = this.calculator_items_[(i + 1)].GetValue();
                this.calculator_items_[i].SetValue(val);

                // and user input (used to display value by memory function)
                text = this.calculator_items_[(i + 1)].UserText();
                this.calculator_items_[i].SetUserText(text);
            }

            if (error == true) {
                // clear calculator function & input
                CX3Calculator.CalculatorClearFunction();

                this.calculator_items_[(CONST.MAX_CALCULATOR_ITEMS - 1)].Clear();
                if (this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].format_hms == false)
                    this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetCalcText("0");
                else
                    this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetCalcText("00:00:00");

                this.firstInput_ = true;

            }
            else {
                // update active line display text with new calc function
                text = CX3Calculator.CalculatorReturnFullText(this.calculator_items_[i].UserText(), CONST.MAX_VALUE_TEXT_LENGTH + 5, CX3Calculator.CalculatorOutputReady);
                this.calculator_items_[i].SetCalcText(text);
            }
        }

    }

    return 0;

}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Process keypress.  If this is the 'enter' key, send the event up to
///    the parent for processing.
///
///  @param [in] <Event> <key data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CalculatorScreen.prototype.OnEventKeypadPush = function (Event) {
    if (DEBUG) {
        console.log("CalculatorScreen.prototype.OnEventKeypadPush");
    }
    var calc_text = "";
    var val;
    var text = "";

    // always pass system events to base class 
    //Pm_Widget::OnEventKeypadPush(Event);        

    // Search this screen's children to find the index of the active child:
    var temp = this.ui.children;
    var idx = 0;
    for (var i = 0; i < temp.length; i++) {
        if (temp[i] == this.activeChild.ui) {
            var idx = i;
            break;
        }
    }

    //var idx = this.calculatorList_.GetSelectedIndex();

    var key = Event.keyName;
    var c = key.charAt(0);

    if (idx == (CONST.MAX_CALCULATOR_ITEMS - 1)) {
        // show unit conversion (decimal <. HMS) on new line
        // ignore if calculator active
        if (CX3Calculator.CalculatorActive == false) {
            if ((key == CONST.CX3_KEY.SET_UNIT) || (key == CONST.CX3_KEY.CONV_UNIT))
                this.output_ = true;
        }
    }
    if ((idx == (CONST.MAX_CALCULATOR_ITEMS - 1)) && ((this.output_ == true) || (this.firstInput_ == true))) {
        // if valid input, move all rows up one (including current output line)
        var valid = false;
        var clear_input = false;
        var set_output = false;
        var set_input = false;
        var hms = this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].format_hms;

        // check for new screen or user input cleared (display '0' on screen but no user input)
        var set_zero_text = false;
        text = this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].UserText();
        var idx = text.length;


        // check calculator function keys
        if ((c == '+') || (c == '-') || (c == '/') || (c == '*')) {
            valid = true;

            if (idx == 0)
                set_zero_text = true;
        }
        // process 'set unit' and 'convert unit' keys
        else if ((key == CONST.CX3_KEY.SET_UNIT) || (key == CONST.CX3_KEY.CONV_UNIT)) {
            valid = true;

            if (idx == 0) {
                set_zero_text = true;
                clear_input = true;
                set_input = true;
            }
            else {
                set_output = true;
            }
        }
        // backspace, clear, +/-, square root
        else if ((key == CONST.CX3_KEY.BACKSPACE) || (key == CONST.CX3_KEY.PLUS_MINUS) || (key == CONST.CX3_KEY.SQUARE_ROOT)
            || (key == CONST.CX3_KEY.CLEAR)) {
            // only for output (not 1st input)
            if (this.output_ == true) {
                // skip if square root and HMS format
                if ((hms == false) || (key != CONST.CX3_KEY.SQUARE_ROOT))
                    valid = true;
            }
        }
        // other valid keys (0 to 9, decimal if not hms format, : if hms format, 
        else if (CONST.CHAR_KEYS.indexOf(key) != -1) {
            if ((c >= '0' && c <= '9') || (c == '.' && hms == false)
                || (c == ':' && hms == true)) {
                // only for output (not 1st input)
                if (this.output_ == true) {
                    valid = true;
                    clear_input = true;
                    set_input = true;    //now this is the 1st input
                }

                // set leading zero text (decimal only)
                if ((idx == 0) && (c == '.'))
                    set_zero_text = true;
            }
        }

        // set proper user input for zero if needed ('0' on display but no user text)
        if (set_zero_text == true) {
            if (hms == false)
                this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetUserText("0");
            else
                this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetUserText("00:00:00");
        }
        if (valid == true) {
            // make sure full HMS input string is displayed
            if ((this.firstInput_ == true) && (hms == true))
                this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetTextFromVal();

            // Make sure HMS value in range
            if (hms == true) {
                val = this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].GetValue();
                // check for user input out of range 
                if (val > CONST.MAX_HMS_HOURS)
                    val = CONST.MAX_HMS_HOURS;
                else if (val < -CONST.MAX_HMS_HOURS)
                    val = -CONST.MAX_HMS_HOURS;

                this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetValue(val);
                this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetTextFromVal();
                //this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetCalcOutputText();

                //()formatHmsValue(&this.userInput_[0], ARRAY_SIZE(this.userInput_), val, true);
            }

            // no longer an output from calculator or first input
            this.output_ = false;
            this.firstInput_ = false;
            this.calculator_items_[CONST.MAX_CALCULATOR_ITEMS - 1].SetOutput(false);

            // Move all items up 1 row 
            for (var i = 0; i < (CONST.MAX_CALCULATOR_ITEMS - 1); i++) {
                // copy calc text from next item
                calc_text = this.calculator_items_[(i + 1)].CalcText();
                this.calculator_items_[i].SetCalcText(calc_text);

                // and value & format
                val = this.calculator_items_[(i + 1)].GetValue();
                this.calculator_items_[i].SetValue(val);
                this.calculator_items_[i].format_hms = this.calculator_items_[(i + 1)].format_hms;

                // and user input (used to display value by memory function)
                text = this.calculator_items_[(i + 1)].UserText();
                this.calculator_items_[i].SetUserText(text);
            }

            if (clear_input == true)
                this.calculator_items_[(CONST.MAX_CALCULATOR_ITEMS - 1)].Clear();

            if (set_output == true)
                this.output_ = true;

            if (set_input == true)
                this.firstInput_ = true;
        }
    }
    // set 'first input' on clear
    if (idx == (CONST.MAX_CALCULATOR_ITEMS - 1)) {
        // clear
        if (key == CONST.CX3_KEY.DELETE) {
            this.firstInput_ = true;
        }
    }

    return 0;
}

/*
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Event callback for when the screen is unlinked from the parent (and 
///      removed from view.  This prevents multiple items from being 
///      'selected' next time the list is shown.
///
///  @param [in] <Event> <event data (id, parameters, source, etc.>
///
///  @return <always returns 0>
///
////////////////////////////////////////////////////////////////////////////////
pm_int_t CalculatorScreen.prototype.OnEventHide = function(const pm_event_t &Event) {
  Pm_Panel::OnEventHide(Event);

  int size = this.calculatorList_.GetNumItems();
  for (int i = 0; i < size; i++) {
    KillFocus(this.calculatorList_.GetThing(i));
  }

  return 0;
}
*/
