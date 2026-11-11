///
// Copyright (c) 2026 Go Around, South Africa. All rights reserved.
// @author  $Author: george $
// @version $Rev: 685 $
// @date    $Date: 2012-02-02 17:22:13 -0800 (Thu, 02 Feb 2012) $
// @brief  Keeps track of current calculator function(s) and value, and performs calculations
//

//#include "CX3Calculator.h"
//#include "CX3Keypad.h"
//#include "formatHmsDms.h"
//
//// Fix name issues with EWL
//#if defined(__EWL__)
//#include <stdio.h>
//#include <stdlib.h>
//#include <cstring>
//#include <math.h>
//#include <string.h>
//#define strnlen strnlen_s
//#endif

CONST.MAX_VALUE_INPUT_LENGTH = 8;
CONST.MAX_VALUE_TEXT_LENGTH = CONST.MAX_VALUE_INPUT_LENGTH << 1;
CONST.MAX_FULL_TEXT_LENGTH = CONST.MAX_VALUE_TEXT_LENGTH << 1;

var CX3Calculator = {
    CalculatorFunction: 0,
    CalculatorNextFunction: 0,
    CalculatorValue: 0,
    CalculatorActive: false,
    CalculatorOutputReady: false,
    CalculatorChanged: false,
    CalculatorMemoryActive: false,
    CalculatorError: false,

    CalculatorValueText: "",
    CalculatorFullText: "",

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Clear calculator function(s) and text input
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorClearFunction: function () {
        this.CalculatorFunction = 0;
        this.CalculatorNextFunction = 0;
        this.CalculatorActive = 0;
        this.CalculatorOutputReady = false;
        this.CalculatorChanged = false;
        this.CalculatorMemoryActive = false;
        this.CalculatorValue = 0;
        this.CalculatorError = false;
        this.CalculatorValueText = "";
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Set calculator function 
    ///
    ///       NOTE: this is used to set the calcualtor function when a 2nd function is pressed
    ///     and the code should perforem the following steps
    ///      1) save CalculatorNextFunction
    ///      2) call CalculatorClearFunction()
    ///      3) call this function with the saved next funciton
    ///      4) if the return value is true, move all lines up 1 row and set new text for new function
    ///
    ///  @param [in] <function> <new calculator function to set>
    ///
    ///  @param [out] <bool> <true if valid function (new function set)>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorSetFunction: function (operation) {
        if ((operation == '+') || (operation == '-') || (operation == '/') || (operation == '*')) {
            this.CalculatorFunction = operation;
            this.CalculatorActive = true;
            return true;
        }
        return false;
    },
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Check calculator for valid function and text input 
    ///    and set CalculatorOutputReady accordingly
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorCheckForOutput: function () {
        // Check for any text and +-*/:
        this.CalculatorOutputReady = (this.CalculatorValueText.length > 0) && ((this.CalculatorFunction == '+') || (this.CalculatorFunction == '-') || (this.CalculatorFunction == '/') || (this.CalculatorFunction == '*'));
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Process key input - Check for and set calculator function, 
    ///               - process user input if active
    ///
    ///  @param [in] <key> <the key to process>
    ///
    ///  @param [in] <hms_or_dms> <true if value is HMS or DMS format, default is false>
    ///
    ///  @param [out] <key> <key for additional processing by calling function>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorProcessKey: function (key, hms_or_dms, allow_2nd) {
        hms_or_dms = (typeof hms_or_dms !== "undefined") ? hms_or_dms : false;
        allow_2nd = (typeof allow_2nd !== "undefined") ? allow_2nd : false;

        var ptr = this.CalculatorValueText;
        var recalculate = false;

        this.CalculatorChanged = false;

        // Current calculator value string length
        var idx = this.CalculatorValueText.length;

        // Set character to check ASCII key codes
        var c = key.charAt(0);

        // Check for calculator function key: "+", "-", "/", "*"
        if ((c == '+') || (c == '-') || (c == '/') || (c == '*')) {
            // Check for 2nd function
            if ((this.CalculatorFunction !== 0) && (idx > 0)) {
                // TODO: allow 2nd function in flgiht equations?
                if (allow_2nd == true) {
                    this.CalculatorNextFunction = c;
                    this.CalculatorOutputReady = true;
                }
            }
            else {
                this.CalculatorFunction = c;
                this.CalculatorActive = true;
                this.CalculatorChanged = true;
            }

            return 0;
        }

        // Process other keys only if calculator has an active function
        if (this.CalculatorActive == false) {
            return key;
        }
        else {
            // make sure this is a key that we care about
            // memory function key 
            if (key == CONST.CX3_KEY.MEMORY) {
                // Set memory input 1
                if ((idx > 0) && (this.CalculatorValue != CONST.NO_VALUE)) {
                    // convvert to full HMS string
                    if (hms_or_dms == true) {
                        // check for user input out of range 
                        if (this.CalculatorValue > CONST.MAX_HMS_HOURS)
                            this.CalculatorValue = CONST.MAX_HMS_HOURS;
                        else if (this.CalculatorValue < -CONST.MAX_HMS_HOURS)
                            this.CalculatorValue = -CONST.MAX_HMS_HOURS;

                        this.CalculatorValueText = formatHmsValue(this.CalculatorValue, true);
                    }
                    MemInputOne.hasValue = true;
                    MemInputOne.val = this.CalculatorValue;
                }
                else {
                    // Clear memory input 1
                    MemInputOne.hasValue = false;
                    MemInputOne.val = CONST.NO_VALUE;
                }
                MemInputOne.text = this.CalculatorValueText;
                MemInputOne.allowRecall = true;
                MemInputOne.valRecalled = false;
                MemInputOne.hms_or_dms = hms_or_dms;

                // indicate memory inputs set/cleared by widget
                MemInputOne.valSet = true;

                // set calculator memory active
                this.CalculatorMemoryActive = true;

            }
            // backspace
            else if (key == CONST.CX3_KEY.BACKSPACE) {
                // Are there characters to delete?
                if (idx > 0) {
                    if (hms_or_dms == true) {
                        this.FormatHMSuserInput = this.FormatHMSuserInput(this.CalculatorValueText, CONST.CX3_KEY.BACKSPACE, false);
                        idx = this.CalculatorValueText.length;
                    }
                    else {
                        idx--;
                        this.CalculatorValueText = this.CalculatorValueText.slice(0, -1);
                    }
                    this.CalculatorChanged = true;
                    recalculate = true;
                }
                // else clear calculator function
                else {
                    this.CalculatorFunction = 0;
                    this.CalculatorActive = false;
                    this.CalculatorChanged = true;
                }
            }
            // plus/minus
            else if (key == CONST.CX3_KEY.PLUS_MINUS) {
                // Is there user input?
                if (idx > 0) {
                    // print value into buffer and check for '-' as first character (works for decimal and HMS)
                    this.CalculatorFullText = this.CalculatorValueText;
                    if (this.CalculatorValueText[0] == '-') {
                        this.CalculatorValueText = this.CalculatorFullText.slice(1);
                    }
                    else {
                        this.CalculatorValueText = "-" + this.CalculatorFullText;
                    }
                    // change value also
                    this.CalculatorValue = -this.CalculatorValue;

                    this.CalculatorChanged = true;
                }
            }
            // square root
            else if (key == CONST.CX3_KEY.SQUARE_ROOT) {
                // Ignore if HMS or DMS input
                if (hms_or_dms == true) {
                    return 0;
                }

                // Is there user input?
                if (idx > 0) {
                    // check for error (can't take square root of negative number)
                    // TODO: always update string & set error condition instead of clearing calculator value text
                    if (this.CalculatorValue < 0) {
                        this.CalculatorValueText = "";    //set 1st char in string to NULL to indicate calculator error
                    }
                    else {
                        this.CalculatorValue = Math.sqrt(this.CalculatorValue);
                        // Print and truncate it:
                        this.CalculatorValueText = this.CalculatorValue.toString().slice(0, CONST.MAX_VALUE_TEXT_LENGTH);

                        // remove trailing decimal zeros (and decimal point if no remainder)
                        if (this.CalculatorValueText.indexOf(".") != -1) {
                            this.CalculatorValueText = this.CalculatorValueText.replace(/\.?0+$/, "");
                            idx = this.CalculatorValueText.length;
                        }
                    }
                    // Indicate calculator output ready to be retrieved
                    this.CalculatorOutputReady = true;
                }
            }
            // enter or equals
            else if ((key == CONST.CX3_KEY.ENTER) || (c == CONST.CX3_KEY.EQUALS)) {
                if (DEBUG) {
                    console.log("enter or equals");
                }
                // if no calculator value, clear calculator function & return
                if (idx == 0) {
                    this.CalculatorFunction = 0;
                    this.CalculatorActive = false;
                    this.CalculatorChanged = true;

                    // return key for additional processing (saving new value)
                    return key;
                }
                else {
                    // Indicate calculator output ready to be retrieved
                    this.CalculatorOutputReady = true;

                    // return key for additional processing (saving new value)
                    return key;
                }
            }
            // clear or back
            else if ((key == CONST.CX3_KEY.CLEAR) || (key == CONST.CX3_KEY.BACK)) {
                // clear input text

                this.CalculatorValueText = "";
                idx = 0;

                // clear calculator function(s)
                this.CalculatorFunction = 0;
                this.CalculatorNextFunction = 0;
                this.CalculatorActive = false;
                this.CalculatorValue = 0;

                // indicate change in calculator value or function
                this.CalculatorChanged = true;
                // Back: return 'enter' to restore original value
                if (key == CONST.CX3_KEY.CLEAR)
                    return CONST.CX3_KEY.ENTER;
            }
            // process 'set unit' and 'convert unit' keys
            else if ((key == CONST.CX3_KEY.SET_UNIT) || (key == CONST.CX3_KEY.CONV_UNIT)) {
                // Indicate calculator output ready to be retrieved
                this.CalculatorOutputReady = true;

                // return key to process set/convert unit
                return key;
            }
            else if (CONST.CHAR_KEYS.indexOf(key) != -1) {
                // Some other ASCII value - see if we need to handle it.  
                // decimal point
                if (c == '.') {
                    // ignore if HMS/DMS format
                    if (hms_or_dms == true) {
                        return 0;
                    }

                    // make sure we don't have two decimal points in the string
                    if (this.CalculatorValueText.indexOf(".") != -1) {
                        return 0;
                    }
                }

                // only allow colon if variable unit format is HMS or DMS
                if (c == ':' && !hms_or_dms) {
                    return 0;
                }

                if ((c >= '0' && c <= '9') || c == '.' || c == '-' || c == ':') {
                    // process HMS user input separately
                    if (hms_or_dms == true) {
                        this.CalculatorValueText = this.FormatHMSuserInput(this.CalculatorValueText, key, false);
                        idx = this.CalculatorValueText.length;

                        recalculate = true;
                        // indicate calculator value has changed
                        this.CalculatorChanged = true;
                    }
                    // Character is valid, insert into input buffer (if there is room)
                    else if (idx < (CONST.MAX_VALUE_TEXT_LENGTH >> 1)) {
                        this.CalculatorValueText += c;

                        recalculate = true;
                        // indicate calculator value has changed
                        this.CalculatorChanged = true;
                    }
                }
            }

        }
        // recalculate calculator value
        if (recalculate == true) {
            if (!hms_or_dms) {
                this.CalculatorValue = parseFloat(this.CalculatorValueText);
            }
            else {
                // calculate values from HMS or DMS formatted string
                this.CalculatorValue = calculateValueFromHmsString(this.CalculatorValueText);
            }
        }

        // default - clear key 
        return 0;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Return full calculator text: input to function (left value), calculator function, and
    ///    current calculator value (if any), with a maximum character limit
    ///
    ///  @param [in] <input_value> <input value string>
    ///
    ///  @param [in] <max_char> <maximum characters to return>
    ///
    ///  @param [out] <const char *> <full text string>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorReturnFullText: function (input_text, max_char, equal_sign, hms_or_dms) {
        equal_sign = (typeof equal_sign !== "undefined") ? equal_sign : false;
        hms_or_dms = (typeof hms_or_dms !== "undefined") ? hms_or_dms : false;

        var len;
        // Current calculator value string length
        var idx = this.CalculatorValueText.length;

        if (idx > 0) {
            if (equal_sign == true) {
                // convvert to full HMS string
                if (hms_or_dms == true) {
                    // check for user input out of range 
                    if (this.CalculatorValue > CONST.MAX_HMS_HOURS) {
                        this.CalculatorValue = CONST.MAX_HMS_HOURS;
                    }
                    else if (this.CalculatorValue < -CONST.MAX_HMS_HOURS) {
                        this.CalculatorValue = -CONST.MAX_HMS_HOURS;
                    }

                    this.CalculatorValueText = formatHmsValue(this.CalculatorValue, true);
                }
                this.CalculatorFullText = input_text + " " + this.CalculatorFunction + " " + this.CalculatorValueText + " =";
            }
            else {
                this.CalculatorFullText = input_text + " " + this.CalculatorFunction + " " + this.CalculatorValueText;
            }
        }
        else {
            this.CalculatorFullText = input_text;
            if (this.CalculatorFunction) {
                this.CalculatorFullText += " " + this.CalculatorFunction + " ";
            }
        }
        len = this.CalculatorFullText.length;

        if (len > max_char)
            return this.CalculatorFullText.slice(len - max_char);
        else
            return this.CalculatorFullText;
    },
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Return full calculator text with square root symbol before calculator value
    ///
    ///  @param [in] <input_value> <input value string>
    ///
    ///  @param [in] <max_char> <maximum characters to return>
    ///
    ///  @param [out] <const char *> <full text string>
    ///
    ////////////////////////////////////////////////////////////////////////////////  

    CalculatorReturnSquareRootFullText: function (input_text, max_char) {
        this.CalculatorFullText = input_text + " " + this.CalculatorFunction + " " + CONST.CX3_KEY.SQUARE_ROOT + this.CalculatorValueText + " =";
        var len = this.CalculatorFullText.length;

        if (len > max_char) {
            return this.CalculatorFullText.slice(len - max_char);
        }
        else {
            return this.CalculatorFullText;
        }
    },
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Return calculator value text
    ///
    ///  @param [out] <const char *> <calculator value text string>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorReturnValueText: function () {
        return this.CalculatorValueText;
    },
    /*
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    fill in a string buffer with the properly formatted calculator output 
    ///
    ///  @param [in] <buffer> <input value string pointer>
    ///
    ///  @param [in] <bufsize> <maximum characters to return>
    ///
    ///  @param [in] <hms_or_dms> <true if value is HMS or DMS format, default is false>
    ///
    ///  @param [out] <int> <number of characters written, zero if invalid output (i.e. divide by zero)>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorGetOutputString : function(buffer, hms_or_dms) {
      hms_or_dms = (typeof hms_or_dms !== "undefined")? hms_or_dms : false;
      var inValue;
      var calcValue;
      var output;
  
      console.log("TODO: check output");
      // Calculator function cleared - no change to input buffer
      if (!this.CalculatorActive) {
        return 1;    //TODO: change to buffer string length?
      }
      else {
        // check for calculator error (no calculator input text)
        if (this.CalculatorValueText.length == 0) {
          return 0;
        }
  
        // change input & calculator strings to values
        if (!hms_or_dms) {
          inValue = parseFloat(buffer);
          calcValue = parseFloat(this.CalculatorValueText);
        }
        else {
          // calculate values from HMS or DMS formatted string
          inValue = calculateValueFromHmsString(buffer);
          calcValue = calculateValueFromHmsString(this.CalculatorValueText);
        }
  
        // If Calculator memory active & Memory value recalled 
        if (this.CalculatorMemoryActive && MemInputOne.valRecalled) {
          calcValue = MemInputOne.val;
        }
  
        // Calculate output value
        if (this.CalculatorFunction == '+') {
          output = inValue + calcValue;
        }
        else if (this.CalculatorFunction == '-') {
          output = inValue - calcValue;
        }
        else if (this.CalculatorFunction == '*') {
          output = inValue * calcValue;
        }
        else if (this.CalculatorFunction == '/') {
          if (calcValue == 0) {
            return 0;    //calculation error - return 0
          }
          output = inValue / calcValue;
        }
        else {
          // Unknown function - return 0
          return 0;
        }
  
        // Change to string 
        if (!hms_or_dms) {
          // TODO: buffer not passed by reference.  Need a better way of doing this.
          buffer = parseFloat(output);
          return buffer.length;
        }
        else {
          buffer = formatHmsValue(output, true);
          return buffer.length;
        }
      }
    },
  */
    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    calculate output from input value, calculator value,  and calculator function 
    ///
    ///  @param [in] <input> <input value>
    ///
    ///  @param [out] <value_t> <calculator output value, CONST.NO_VALUE if invalid output (i.e. divide by zero)>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    CalculatorReturnOutput: function (inValue, hms_or_dms) {
        //value_t calcValue;
        var output = CONST.NO_VALUE;

        this.CalculatorError = false;
        // Make sure Calculator function active & there is a valid calculator value
        if (this.CalculatorActive && (this.CalculatorValueText.length > 0)) {
            // If Calculator memory active & Memory value recalled 
            if (this.CalculatorMemoryActive && MemInputOne.valRecalled) {
                this.CalculatorValue = MemInputOne.val;
            }

            // HMS - convert sec to hours for multiply or divide
            if (hms_or_dms == true) {
                // check for user input out of range 
                if (this.CalculatorValue > CONST.MAX_HMS_HOURS) {
                    this.CalculatorValue = CONST.MAX_HMS_HOURS;
                }
                else if (this.CalculatorValue < -CONST.MAX_HMS_HOURS) {
                    this.CalculatorValue = -CONST.MAX_HMS_HOURS;
                }

                // for multiply & divide, change value to hours from seconds
                if ((this.CalculatorFunction == '*') || (this.CalculatorFunction == '/')) {
                    this.CalculatorValue /= 3600;
                }
            }
            // Calculate output value
            if (this.CalculatorFunction == '+') {
                output = inValue + this.CalculatorValue;
            }
            else if (this.CalculatorFunction == '-') {
                output = inValue - this.CalculatorValue;
            }
            else if (this.CalculatorFunction == '*') {
                output = inValue * this.CalculatorValue;
            }
            else if (this.CalculatorFunction == '/') {
                // no divide by zero
                if (this.CalculatorValue != 0) {
                    output = inValue / this.CalculatorValue;
                }
                else {
                    this.CalculatorError = true;
                }
            }
            else {
                // Unknown function - set error condition
                this.CalculatorError = true;
            }

            // HMS - convert sec to hours for multiply or divide
            if (hms_or_dms == true) {
                // set calculator error if |val| >= 1000 hours (limit 999:59:59)
                if ((output > CONST.MAX_HMS_HOURS) || (output < -CONST.MAX_HMS_HOURS))
                    this.CalculatorError = true;
            }
        }
        else {
            // Calculator not active or invalid calculator value (i.e. square root of negative number)
            this.CalculatorError = true;
        }

        return output;
    },

    ////////////////////////////////////////////////////////////////////////////////
    ///  @brief  
    ///    Format HMS or DMS user input - also format displayed text
    ///    
    ///    TODO: format for DMS: DDD:MM:SS (all others HH:MM:SS) - implement similar to below
    ///    TODO: process negative values: buf++ at start, buf-- at end if re-formatting for display
    ///
    ///  @param [in] <buffer> <input value string pointer>
    ///
    ///  @param [in] <bufsize> <maximum characters to return>
    ///
    ///  @param [in] <key> <key to process>
    ///
    ///  @param [in] <dms> <true if value is DMS format>
    ///
    ///  @param [out] <int> <number of characters written, zero if invalid output (i.e. divide by zero)>
    ///
    ////////////////////////////////////////////////////////////////////////////////  
    FormatHMSuserInput: function (buffer, key, dms) {
        var c1; // position of 1st colon in HMS string

        // make sure this is a key that we care about
        // check for backspace (delete) key
        if (key == CONST.CX3_KEY.BACKSPACE) {
            // Remove the last character and any trailing colons:
            return buffer.replace(/:?[\d:-]$/, "");
        }

        // Make a copy of the string:
        var temp = buffer;
        if (temp.charAt(0) == "-") {
            temp = temp.slice(1);
        }

        // find first colon
        c1 = temp.indexOf(':');
        if (c1 == -1) {
            c1 = 2; // max 5 digits: HHH:
        }

        // check for count down timer value input
        if (CONST.TIMER_KEYS.indexOf(key) != -1) {
            var c = key[0];

            // Process user input
            // TODO: process DMS format separately
            if (temp.length < (c1 + 6)) {
                var idx = temp.length;
                // limit to HH:MM:SS or HHH:MM:SS format (with optional minus sign)
                if (c == ':') {
                    if ((idx == 0) || (idx == (c1 + 1))) {
                        buffer += "00";
                    }
                    else if ((idx == 1) || (idx == (c1 + 2))) {
                        c = buffer[buffer.length - 1];
                        buffer = buffer.slice(0, -1) + "0" + c;
                    }
                    // set colon and update display
                    if ((idx <= c1) || (idx == (c1 + 3))) {
                        buffer += ':';
                    }
                }
                else if ((c >= '0' && c <= '9')) {
                    if ((idx == c1) || (idx == (c1 + 3))) {
                        buffer += ':';
                    }
                    buffer += c;
                }
            }

        }

        /*\/ check for display update 
          if (user_input == true) {
          ptr = 0;    //point to current HH, MM, or SS value
    
        //seconds
        if (idx < 6) {
        // no seconds to display, display '--'
        items_[TIMER_ITEM_VALUE]->ChangeRightText("--");
        }
        else if (idx == 6) {
        // seconds data entry - no value yet - display zero
        items_[TIMER_ITEM_VALUE]->ChangeRightText("0");
        }
        else {
        // set string
        str[0] = userInput_[6];
        if (idx == 8) {
        str[1] = userInput_[7];
        str[2] = 0;
        }
        else {
        str[1] = 0;
        }
        items_[TIMER_ITEM_VALUE]->ChangeRightText(str);
        }
    
        // minutes
        if (idx < 3) {
        // no hours to display, display "--:"
        items_[TIMER_ITEM_VALUE]->ChangeText("--:");
        }
        else if (idx == 3) {
        // seconds data entry - no value yet - display zero & colon
        items_[TIMER_ITEM_VALUE]->ChangeText("0:");
        }
        else {
        // set string
        str[0] = userInput_[3];
        if (idx > 4) {
        str[1] = userInput_[4];
        str[2] = ':';
        str[3] = 0;
        }
        else {
        str[1] = ':';
        str[2] = 0;
        }
        items_[TIMER_ITEM_VALUE]->ChangeText(str);
        }
    
        // hours
        if (idx == 0) {
        // no user input (or input cleared) - display zero with colon
        items_[TIMER_ITEM_VALUE]->ChangeLeftText("0:");
        }
        else {
        // set string
        str[0] = userInput_[0];
        if (idx > 1) {
          str[1] = userInput_[1];
          str[2] = ':';
          str[3] = 0;
        }
        else {
          str[1] = ':';
          str[2] = 0;
        }
        items_[TIMER_ITEM_VALUE]->ChangeLeftText(str);
      },
    
      },
      */

        return buffer;
    }
};

