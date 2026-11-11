///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: mike $
// @version $Rev: 402 $
// @date    $Date: 2011-06-07 07:39:44 -0700 (Tue, 07 Jun 2011) $
// @brief   Widget to be used in a menu list.  Elements have properties (e.g. text) and let
//      their owners know when they are 'clocked'
//

/*
#include "CX3CalculatorWidget.h"
#include "formatHmsDms.h"
#include <math.h>
#include <stdlib.h>
#include <cassert>

namespace CX3_UI {

using namespace CX3Calculator;  //for calculator functions (plus, minus, divide, multiply)

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
pm_event_table_entry CX3CalculatorWidgetEvents[] = {
{ PM_EVENT_KEYPAD_PUSH,    PM_EVENT_HANDLER(&CX3CalculatorWidget::OnEventKeypadPush)},
{ PM_EVENT_GAINED_FOCUS,  PM_EVENT_HANDLER(&CX3CalculatorWidget::OnEventGainedFocus)},
{ 0, NULL}   // array terminator //
};
 */

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default CX3CalculatorWidget.  
///
///  Memory is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
////////////////////////////////////////////////////////////////////////////////
function CX3CalculatorWidget() {
    Widget.call(this);

    // Create the DOM element for this widget:
    this.ui.addClass("cx3-calculator");

    this.val_ = CONST.NO_VALUE;
    this.output_ = false;
    this.active_ = false;
    this.format_hms = false;
    this.userInput_ = ""; // Max length is CX3CalculatorWidget.USER_INPUT_MAX_LENGTH

    // Set the events:
    this.addEvent("cx3-keypress", this.OnEventKeypadPush);
    this.addEvent("cx3-focus", this.OnEventGainedFocus);
}
// CX3CalculatorWidget is a subclass of Widget:
CX3CalculatorWidget.inheritsFrom(Widget);
// CX3CalculatorWidget.USER_INPUT_MAX_LENGTH = 30;
CX3CalculatorWidget.USER_INPUT_MAX_LENGTH = 30;

/*
////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Clean up after ourselves and remove memory that we may have allocated.
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget::~CX3CalculatorWidget() {
  Destroy(this.calcText_);
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
pm_int_t CX3CalculatorWidget.prototype.Notify = function(const pm_event_t &Event) {
  pm_event_table_entry *pEventList = CX3CalculatorWidgetEvents;

  while(pEventList.EventType) {
    if (pEventList.EventType == Event.Type) {
      if (pEventList.Handler == NULL) {
        return 0;
      }
      return PM_CALL_EVENT_HANDLER(*this, pEventList.Handler)(Event);
    }
    pEventList++;
  }

  return CX3ListItemBaseWidget::Notify(Event);
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Override the base class implementation to allow for background painting
///    and element underline.
///
///  @param [in] <Invalid> <region that has been marked for painting>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.Paint = function(const Pm_Region &Invalid) {
  pm_uint_t  FillId;
  Pm_Region loc;

  // Call base class to paint first
  Pm_Widget::Paint(Invalid);

  // Do our painting
  OpenCanvas(Invalid);  


  // create a brush
  Pm_Brush Brush;
  Brush.LineColor = 0;
  FillId = mColorId[PM_CI_NORMAL];
  Brush.FillColor = Pm_Resource_Manager::GetColor(FillId);
  Brush.Style = PBS_SOLID_FILL;
  Brush.Width = 0;

  // paint the background
  Rectangle(Invalid, Brush);

  // paint rectangles inside rounded edge area
  if (mStyle & PM_PAINT_SELECTED) {
    // Select proper background color
    FillId = mColorId[PM_CI_FOCUSFILL];
  }
  else {
    // Select proper background color
    FillId = mColorId[PM_CI_NORMAL];
  }
  Brush.FillColor = Pm_Resource_Manager::GetColor(FillId);
  loc = mSize;
  // rectangle: full vertical, horizontal - rounded edge size
  loc.Left += ROUNDED_EDGE_SIZE;
  loc.Right -= ROUNDED_EDGE_SIZE;
  Rectangle(loc, Brush);

  // rectangle: full horizontal, vertical - rounded edge size
  loc = mSize;
  loc.Top += ROUNDED_EDGE_SIZE;
  loc.Bottom -= ROUNDED_EDGE_SIZE;
  Rectangle(loc, Brush);

  // paint the rounded edges
  Brush.Style |= PBS_TRUE_ALIAS;
  //Brush.Width = 2;
  //Brush.FillColor = PM_CLR_RED;
  loc.Left += ROUNDED_EDGE_SIZE;
  loc.Right -= ROUNDED_EDGE_SIZE;
  // top left
  Circle(loc.Left, 
      loc.Top, 
      ROUNDED_EDGE_SIZE,
      Brush);
  // top right
  Circle(loc.Right, 
      loc.Top, 
      ROUNDED_EDGE_SIZE,
      Brush);
  // bottom left
  Circle(loc.Left, 
      loc.Bottom, 
      ROUNDED_EDGE_SIZE,
      Brush);
  // bottom right
  Circle(loc.Right, 
      loc.Bottom, 
      ROUNDED_EDGE_SIZE,
      Brush);


  PaintChildren(Invalid);
  CloseCanvas();
}
*/

CX3CalculatorWidget.prototype.Clear = function () {
    this.SetCalcText("");
    this.userInput_ = "";
    this.output_ = false;
    this.val_ = 0;
}

CX3CalculatorWidget.prototype.GetValue = function () {
    return this.val_;
}

CX3CalculatorWidget.prototype.SetValue = function (val) {
    this.val_ = val;
}

CX3CalculatorWidget.prototype.SetOutput = function (val) {
    this.output_ = val;
}

CX3CalculatorWidget.prototype.UserText = function () {
    return this.userInput_;
}

CX3CalculatorWidget.prototype.CalcText = function () {
    return this.value.innerText || this.value.textContent;
}
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set the user input text
///
///  @param [in] <text> <text to show>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.SetUserText = function (text) {
    this.userInput_ = text;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set the user input text from current value
///
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.SetTextFromVal = function () {
    if (this.format_hms == true) {
        this.userInput_ = formatHmsValue(this.val_, true);
    }
    else {
        this.userInput_ = this.val_.toString();
    }

    // remove trailing zeros and format large values
    this.SetCalcOutputText();

}
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set the text to be shown on the display
///
///  @param [in] <text> <text to show>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.SetCalcText = function (text) {
    this.value.innerText = text;
    this.value.textContent = text;
}
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set calculator text (shown on display) to calculator input
///    (stored in user input)
///
///  @param [in] <text> <text to show>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.SetCalcOutputText = function () {
    var idx = this.userInput_.length;
    var c;

    // HMS - no formatting - just set displayed text
    if (this.format_hms == false) {
        // remove trailing zeros (and decimal) from user input
        if (this.userInput_.indexOf(".") != -1) {
            this.userInput_ = this.userInput_.replace(/\.?0+$/, "");
            idx = this.userInput_.length;
        }
        // format very large numbers
        if (idx > CONST.MAX_CHARACTERS) {
            // truncate decimal places
            var temp = this.userInput_.indexOf('.');
            if (temp != -1) {
                if (temp < CONST.MAX_CHARACTERS - 1) {
                    this.userInput_ = this.userInput_.substr(0, CONST.MAX_CHARACTERS);
                    idx = this.userInput_.length;
                }
                else {
                    idx = CONST.MAX_CHARACTERS + 1;
                }
            }
        }
        if (idx > CONST.MAX_CHARACTERS) {
            // remove any decimal places
            this.userInput_ = parseFoat(this.userInput_).toFixed(0);
            idx = this.userInput_.length;
        }
        if (idx > CONST.MAX_CHARACTERS) {
            // display as exponential value
            this.userInput_ = parseFoat(this.userInput_).toExponential(1);
            idx = this.userInput_.length;
        }
    }
    this.SetCalcText(this.userInput_);
}
////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Set the text to be shown and event info to be communicated when the 
///    item is clicked.
///
///  @param [in] <text> <text to show for new list item>
///
///  @param [in] <active_line> <true if this is the active calculator line- used to set font colors when selected>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.Set = function (text, active_line) {
    // Remove old data
    this.Clear();

    // active calculator line - do not highlight when selected, white text
    this.active_ = active_line;
    /*
    if (active_line == true) {
      // Set default colors for this widget
      mColorId[PM_CI_NORMAL] = CID_PANEL_FILL;
      mColorId[PM_CI_FOCUSFILL] = CID_PANEL_FILL;
  
      this.calcText_.SetColor(PM_CI_FOCUSFILL, this.mChildColorIds_[PM_CI_NORMAL]);
      this.calcText_.SetColor(PM_CI_TEXT, CID_VALUE_TEXT);
      this.calcText_.SetColor(PM_CI_FOCUS_TEXT, CID_VALUE_TEXT);
    }
    */

    // set text
    //strncpy(&this.userInput_[0], text, ARRAY_SIZE(this.userInput_));

    this.SetCalcText(text);

    // Set calculator widget data
    this.output_ = false;
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Widget has gained focus (e.g. is selected and input will be directed
///    here).
///
///  @param [in] <Event> <Keypad push event data>
///
///  @return <always returns 0 (1 causes Prism to terminate)>
///
////////////////////////////////////////////////////////////////////////////////
CX3CalculatorWidget.prototype.OnEventGainedFocus = function (Event) {
    // always pass system events to base class 
    //CX3ListItemBaseWidget::OnEventGainedFocus(Event);       

    // If active line - check for return from memory function
    if (this.active_ == true) {
        // Check for Calculator memory active on active calculator line
        if (CX3Calculator.CalculatorMemoryActive == true) {
            var text = CX3Calculator.CalculatorReturnFullText(this.userInput_, CX3CalculatorWidget.USER_INPUT_MAX_LENGTH, CX3Calculator.CalculatorOutputReady, this.format_hms);
            this.SetCalcText(text);

            CX3Calculator.CalculatorMemoryActive = false;
            MemInputOne.valRecalled = false;
        }
        else if (MemInputOne.valRecalled == true) {
            // If current value calculator output, send event for calculatorScreen to handle 
            if (this.output_ == true) {
                // set output false
                //this.output_ = false;

                // send new event up to parent
                this.owner.post(CX3_WIDGET_EVENT.CALCULATOR_OUTPUT_READY, { param: 0, target: this });

            }
            else {
                // update display string and value
                this.SetCalcText(this.userInput_);
                this.val_ = MemInputOne.val;
                MemInputOne.valRecalled = false;
            }
        }

    }
    Event["handled"] = true;
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
CX3CalculatorWidget.prototype.OnEventKeypadPush = function (Event) {
    var calc_val = "";
    var text;
    this.owner.fire("cx3-keypress", Event);
    Event.handled = true;

    // pass memory function key AFTER processing
    if (Event.keyName != CONST.CX3_KEY.MEMORY) {
        // always pass system events to base class 
        //TODO: Something may need to happen here.
        //Pm_Widget::OnEventKeypadPush(Event);        

        // TODO: select active calculator line on valid key?
        // ignore if not active input 
        if (this.active_ == false) {
            return 0;
        }
    }
    var idx = this.userInput_.length;
    var key = Event.keyName;

    // ignore set/convert units
    //if ((key == PM_KEY_F2) || (key == PM_KEY_F3))
    //  return 0;

    // if we have user input, send key to calculator 1st for processing
    // calculator will clear key or return key required for further processing
    if ((idx > 0) && (this.active_ == true)) {
        var calc_idx = 0;
        // Square root key - store full outupt text before calculator modifies text
        // Ignore if HMS format
        if ((key == CONST.CX3_KEY.SQUARE_ROOT) && (this.format_hms == false)) {
            var calc_input = CX3Calculator.CalculatorReturnValueText();
            calc_idx = calc_input.length;
            if (calc_idx > 0) {
                text = CX3Calculator.CalculatorReturnSquareRootFullText(this.userInput_, CX3CalculatorWidget.USER_INPUT_MAX_LENGTH);
            }
        }
        key = CX3Calculator.CalculatorProcessKey(Event.keyName, this.format_hms, true);  // true for allow 2nd function

        // reset key if square root
        if (calc_idx > 0)
            key = CONST.CX3_KEY.SQUARE_ROOT;
    }
    // Check calculator for output ready or change in value/function
    if ((CX3Calculator.CalculatorChanged == true) || (CX3Calculator.CalculatorOutputReady == true)) {
        // Make sure full HMS string is shown
        if (this.format_hms == true) {
            // check for user input out of range 
            if (this.val_ > CONST.MAX_HMS_HOURS)
                this.val_ = CONST.MAX_HMS_HOURS;
            else if (this.val_ < -CONST.MAX_HMS_HOURS)
                this.val_ = -CONST.MAX_HMS_HOURS;

            this.userInput_ = formatHmsValue(this.val_, true);
        }
        if (key != CONST.CX3_KEY.SQUARE_ROOT)
            text = CX3Calculator.CalculatorReturnFullText(this.userInput_, CX3CalculatorWidget.USER_INPUT_MAX_LENGTH, CX3Calculator.CalculatorOutputReady, this.format_hms);
        this.SetCalcText(text);

        //send 'calculator output ready' event for processing by calculatorScreen
        if (CX3Calculator.CalculatorOutputReady == true) {
            this.output_ = true;

            // send new event up to parent
            this.owner.post(CX3_WIDGET_EVENT.CALCULATOR_OUTPUT_READY, { param: 0, target: this });
        }
        return 0;
    }

    if (key === 0) {
        //var c = 0;
        var c = undefined;
    }
    else {
        var c = key.charAt(0);
    }

    // make sure this is a key that we care about
    if (key == CONST.CX3_KEY.BACKSPACE) {
        // Are the characters to delete?
        if (idx > 0) {
            if (this.format_hms == false) {
                this.userInput_ = this.userInput_.slice(0, -1);
                idx = this.userInput_.length;
                // update input value
                this.val_ = parseFloat(this.userInput_);
            }
            else {
                this.userInput_ = CX3Calculator.FormatHMSuserInput(this.userInput_, CONST.CX3_KEY.BACKSPACE, false);
                idx = this.userInput_.length;
                // update input value
                this.val_ = calculateValueFromHmsString(this.userInput_);
            }
            // If the string is not empty now, then write it to screen
            // else write the undefined prompt.
            if (idx > 0) {
                this.SetCalcText(this.userInput_);
            }
            else {
                if (this.format_hms == false)
                    this.SetCalcText("0");
                else
                    this.SetCalcText("00:00:00");
            }
        }
    }
    // plus/minus
    else if (key == CONST.CX3_KEY.PLUS_MINUS) {
        // Is there user input?
        // TODO: if output, move to new line (happens now) and re-set to output? 
        //       (right now treated as new, active input)
        if (idx > 0) {
            //TODO: ignore if user input value = 0
            // copy string to buffer and add/remove minus sign (works for decimal or HMS/DMS)
            if (this.userInput_.charAt(0) == '-')
                this.userInput_ = this.userInput_.slice(1);
            else
                this.userInput_ = "-" + this.userInput_;

            // assign the text to the UI element
            this.SetCalcText(this.userInput_);

            // update value
            this.val_ = -this.val_;
        }
    }
    // square root
    else if (key == CONST.CX3_KEY.SQUARE_ROOT) {
        // skip if HMS format or no user input
        if ((idx > 0) && (this.format_hms == false)) {
            // add square root symbol & equals sign to display string
            calc_val = CONST.CX3_KEY.SQUARE_ROOT + this.userInput_ + " =";
            this.SetCalcText(calc_val);

            // send new event up to parent
            this.owner.post(CX3_WIDGET_EVENT.CALCULATOR_OUTPUT_READY, { target: this, param: CONST.CX3_KEY.SQUARE_ROOT });
        }
    }
    else if (key == CONST.CX3_KEY.CLEAR) {
        // clear input text & replace display text with zero, "0"
        this.Clear();
        if (this.format_hms == false)
            this.SetCalcText("0");
        else
            this.SetCalcText("00:00:00");
        // update value
        this.val_ = 0;
    }
    // process 'set unit' and 'convert unit' keys
    else if ((key == CONST.CX3_KEY.SET_UNIT) || (key == CONST.CX3_KEY.CONV_UNIT)) {
        if (this.format_hms == false) {
            this.format_hms = true;
            if (DEBUG) {
                console.log("this.format_hms = true");
            }
            if (idx > 0) {
                // convert from hours to seconds
                if (DEBUG) {
                    console.log("this.val_=" + this.val_);
                }
                this.val_ *= 3600;
                if (DEBUG) {
                    console.log("CONST.MAX_HMS_HOURS=" + CONST.MAX_HMS_HOURS);
                    console.log("this.val_=" + this.val_);
                }

                // display 'Error' if |val| >= 1000 hrs
                if ((this.val_ > CONST.MAX_HMS_HOURS) || (this.val_ < -CONST.MAX_HMS_HOURS)) {
                    // set value to -1 
                    this.val_ = -1;

                    // and send output ready signal with square root key
                    // (calculator screen will clear value, display "Error", and show new input line
                    // send new event up to parent
                    this.owner.post(CX3_WIDGET_EVENT.CALCULATOR_OUTPUT_READY, { target: this, param: CONST.CX3_KEY.SQUARE_ROOT });
                }
                else {
                    this.userInput_ = formatHmsValue(this.val_, true);
                    this.SetCalcText(this.userInput_);
                }
            }
            else {
                // set default (no value) text
                this.SetCalcText("00:00:00");
            }
        }
        // convert from hms
        else {
            this.format_hms = false;
            if (idx > 0) {
                // convert seconds to hours
                console.log("seconds: this.val_=" + this.val_);
                this.val_ /= 3600;
                console.log("hours: this.val_=" + this.val_);
                // TODO: need to add rounding
                this.userInput_ = this.val_.toString().slice(0, CX3CalculatorWidget.USER_INPUT_MAX_LENGTH);
                console.log("this.userInput_=" + this.userInput_);
                // remove trailing zeros (and decimal if no remainder)
                this.userInput_ = this.userInput_.replace(/\.?0+$/, "");
                idx = this.userInput_.length;
                // update display text
                this.SetCalcText(this.userInput_);
            }
            else {
                // set default (no value) text
                this.SetCalcText("0");
            }
        }
    }
    // process all other valid keys: 0 to 9, decimal, colon, minus
    // TODO: remove minus?
    else if ((c >= '0' && c <= '9') || c == '.' || c == ':') {
        // Some other ASCII value.  Convert and see if we need to handle it.  
        if (this.format_hms == true) {
            // only process appropriate keys
            if ((c >= '0' && c <= '9') || c == ':') {
                this.userInput_ = CX3Calculator.FormatHMSuserInput(this.userInput_, key, false);
                idx = this.userInput_.length;
                // assign the text to the UI element
                this.SetCalcText(this.userInput_);
                // update input value
                this.val_ = calculateValueFromHmsString(this.userInput_);
            }
        }
        else {
            // make sure we don't have two decimal points in the string
            if (c == '.') {
                if (this.userInput_.indexOf(".") != -1) {
                    return 0;
                }
            }

            if ((c >= '0' && c <= '9') || c == '.' || c == '-') {
                // negative only allowed in the first character?
                if ((idx > 0) && c == '-')
                    return 0;

                // Character is valid, insert into input buffer (if there is room)
                if (idx < (CONST.MAX_VALUE_TEXT_LENGTH >> 1)) {
                    this.userInput_ += c;

                    // assign the text to the UI element
                    this.SetCalcText(this.userInput_);

                    // update value
                    this.val_ = parseFloat(this.userInput_);
                }
            }
        }
    }

    // process memory function key & send up 
    if (key == CONST.CX3_KEY.MEMORY) {
        // Set memory input 1
        //if ((idx > 0) || (this.active_ == false))
        if (idx > 0) {
            // Make sure full HMS string is shown
            if (this.format_hms == true) {
                // check for user input out of range 
                if (this.val_ > CONST.MAX_HMS_HOURS)
                    this.val_ = CONST.MAX_HMS_HOURS;
                else if (this.val_ < -CONST.MAX_HMS_HOURS)
                    this.val_ = -CONST.MAX_HMS_HOURS;

                this.userInput_ = formatHmsValue(this.val_, true);

                this.SetCalcText(this.userInput_);
            }
            MemInputOne.hasValue = true;
            MemInputOne.val = this.val_;
        }
        else {
            // Clear memory input 1
            MemInputOne.hasValue = false;
            MemInputOne.val = CONST.NO_VALUE;
        }
        // set text pointer for memory recall or store
        MemInputOne.text = this.userInput_;
        //if ((this.active_ != true) || (this.output_ == true))
        if (this.active_ != true)
            MemInputOne.allowRecall = false;
        else
            MemInputOne.allowRecall = true;
        MemInputOne.valRecalled = false;
        MemInputOne.hms_or_dms = this.format_hms;

        // indicate memory input set/cleared
        MemInputOne.valSet = true;

    }

    if ((key == CONST.CX3_KEY.MEMORY) || (CX3Calculator.CalculatorMemoryActive == true)) {
        // always pass system events to base class 
        //TODO: something needs to happen here.
        //Pm_Widget::OnEventKeypadPush(Event);        

    }

    return 0;
}
