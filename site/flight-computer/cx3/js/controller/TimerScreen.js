///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  
//  Class Name: listScreen
//  
//   Copyright (c) 2026 Go Around, South Africa. All rights reserved.
//  
//  Notes:
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

//#include "prism_includes.h"
//#include "calculator.h"
//#include "CX3_UI_res.h"
//#include "timerScreen.h"
//#include "widgetIDs.h"
//#include "calc_utility.h"
//#include "formatHmsDms.h"
//#include <string.h>
//
//// Fix name issues with EWL
//#ifdef _EWL_STRING_H
//#define strnlen strnlen_s
//#endif

/// @brief
/// Event table for this class.  The events below have special functions that override the 
/// base implementation.
//pm_event_table_entry timerScreenEvents[] = {
//TimerScreen.prototype.OnEventHide = function)},
//TimerScreen.prototype.OnEventKeypadPush = function)},
//TimerScreen.prototype.OnEventTimer = function)},
//  { 0, NULL}   /* array terminator */
//};

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    Builds a default timerScreen panel and creates the children.  Memory
///    is only allocated during construction and will be reused throughout
///    the lifetime of this object.
///
///  @param [in] <size> <Display size for this panel>
///
////////////////////////////////////////////////////////////////////////////////
function TimerScreen() {
    Panel.call(this);
    this.title = "TIMER";
    this.ui.addClass("center");

    // Create timer list & resize timer value and HMS text widgets
    this.timerValue_ = new TimerDisplayWidget();
    this.timerValue_.setDisplay(false, 0, 0, 0);
    this.addChild(this.timerValue_);

    // Add the labels:
    var labels = document.querySelector("#templates>.timer-labels").cloneNode(true);
    this.ui.appendChild(labels);

    this.startStop_ = new CX3MenuItemWidget();
    this.startStop_.Set("Start", TimerScreen.EVENTS.START_STOP, 0);
    this.addChild(this.startStop_);

    this.restart_ = new CX3MenuItemWidget();
    this.restart_.Set("Restart", TimerScreen.EVENTS.RESTART, 0);
    this.addChild(this.restart_);

    this.reset_ = new CX3MenuItemWidget();
    this.reset_.Set("Reset", TimerScreen.EVENTS.RESET, 0);
    this.addChild(this.reset_);

    // Create the stopwatch:
    this.stopWatch_ = new StopWatch();
    // Bind the callback to this object:
    this.stopWatchCallback = TimerScreen.STOP_WATCH_CALLBACK.bind(this);
    this.stopWatch_.setTickCallback(this.stopWatchCallback);

    this.timerActive = false;
    this.startValue_ = 0;
    this.countDown_ = false;
    this.userInput_ = "";
    this.index_ = 0;
    this.dirty_ = false;

    // Set current display_time
    this.display_time_ = {};
    this.display_minus_ = false;
    this.display_time_.hours = 0;
    this.display_time_.minutes = 0;
    this.display_time_.seconds = 0;

    // Sign up for notifications from our variable.
    this.var_ = TimerUpdate;
    this.var_.addDependent(this);

    // Attach the needed events:
    this.addEvent("cx3-keypress", Panel.EVENTS.DEFAULT_NAVIGATION);
    this.addEvent("cx3-keypress", TimerScreen.EVENTS.USER_INPUT);
    this.addEvent("cx3-blur", TimerScreen.EVENTS.TIMER_LOST_FOCUS);
}
// TimerScreen is a subclass of Panel:
TimerScreen.inheritsFrom(Panel);

TimerScreen.EVENTS = {
    USER_INPUT: function (_details) {
        // Is this a key that can active input mode?
        if (CONST.TIMER_KEYS.indexOf(_details["keyName"]) != -1) {
            // Active the timer value widget if it is not active already:
            if (this.activeChild !== this.timerValue_) {
                this.activeChild = this.timerValue_;
            }

            // TODO: stop the timer:

            // Was the timer clean before?
            if (!this.dirty_) {
                // Mark the input as dirty:
                this.dirty_ = true;
                this.userInput_ = "_";
                this.index_ = 0;
                this.timerValue_.setDisplaySign(false);
                this.timerValue_.setDisplayFromText(this.userInput_);

                // Stop the stopwatch:
                this.timerRunning = false;
                this.stopWatch_.stop();
            }
        }
        if (this.dirty_ && this.activeChild == this.timerValue_) {
            // Check the keys:
            switch (_details["keyName"]) {
                case CONST.CX3_KEY._0:
                case CONST.CX3_KEY._1:
                case CONST.CX3_KEY._2:
                case CONST.CX3_KEY._3:
                case CONST.CX3_KEY._4:
                case CONST.CX3_KEY._5:
                case CONST.CX3_KEY._6:
                case CONST.CX3_KEY._7:
                case CONST.CX3_KEY._8:
                case CONST.CX3_KEY._9:
                    var key = _details["keyName"];
                    if (this.index_ < 6) {
                        this.userInput_ = this.userInput_.replace(/_/, key + "_");
                        this.index_++;
                    }
                    _details["handled"] = true;
                    this.updateTimerDisplay();
                    //this.timerValue_.setDisplayFromText(this.userInput_);
                    break;
                case CONST.CX3_KEY.COLON:
                    // Jump to the next set of digits:
                    if (this.index_ == 0 || this.index_ == 2) {
                        this.userInput_ = this.userInput_.replace(/_/, "00_");
                        this.index_ += 2;
                    }
                    else if (this.index_ == 1 || this.index_ == 3) {
                        this.userInput_ = this.userInput_.replace(/_/, "0_");
                        this.index_++;
                    }
                    this.updateTimerDisplay();
                    //this.timerValue_.setDisplayFromText(this.userInput_);
                    _details["handled"] = true;
                    break;
                case CONST.CX3_KEY.CLEAR:
                    // Clear all the user input:
                    this.userInput_ = "_";
                    this.index_ = 0;
                    this.updateTimerDisplay();
                    //this.timerValue_.setDisplayFromText(this.userInput_);
                    _details["handled"] = true;
                    break;
                case CONST.CX3_KEY.BACKSPACE:
                    this.userInput_ = this.userInput_.replace(/._/, "_");
                    if (this.index_ > 0) {
                        this.index_--;
                    }
                    this.updateTimerDisplay();
                    //this.timerValue_.setDisplayFromText(this.userInput_);
                    _details["handled"] = true;
                    break;
                case CONST.CX3_KEY.EQUALS:
                case CONST.CX3_KEY.ENTER:
                    this.validateInput();
                    this.activateNextChild();
                    _details["handled"] = true;
            }
        }
    },
    START_STOP: function (_details) {
        // This is for a CX3MenuItemWidget.
        if (_details["keyName"] == CONST.CX3_KEY.ENTER) {
            this.owner.startStopTimer();
            _details["handled"] = true;
        }
    },
    RESTART: function (_details) {
        // This is for a CX3MenuItemWidget.
        if (_details["keyName"] == CONST.CX3_KEY.ENTER) {
            this.owner.restartTimer();
            _details["handled"] = true;
        }
    },
    RESET: function (_details) {
        // This is for a CX3MenuItemWidget.
        if (_details["keyName"] == CONST.CX3_KEY.ENTER) {
            this.owner.resetTimer();
            _details["handled"] = true;
        }
    },
    TIMER_LOST_FOCUS: function (_details) {
        if (_details["target"] == this.timerValue_ && this.dirty_) {
            this.validateInput();
            _details["handled"] = true;
        }
    }
};

// To be bound to the object in the constructor.
TimerScreen.STOP_WATCH_CALLBACK = function (_elapsedMS) {
    this.updateTimerDisplay();
    //this.timerValue_.setDisplayTime(Math.floor(_elapsedMS / 1000));
}

TimerScreen.prototype.getStopWatchElapsedTime = function () {
    return Math.floor(this.stopWatch_.getElapsedTime() / 1000);
}

TimerScreen.prototype.validateInput = function () {
    // Zero pad empty input:
    var temp = this.userInput_.replace(/_/, "000000").substr(0, 6);
    temp = temp.substr(0, 2) + ":" + temp.substr(2, 2) + ":" + temp.substr(4, 2);
    this.resetTimer();
    this.startValue_ = calculateValueFromHmsString(temp);
    this.updateTimerDisplay();
    //this.timerValue_.setDisplayTime(this.startValue_);
    this.dirty_ = false;
}

Object.defineProperty(TimerScreen.prototype, "timerRunning", {
    get: function () {
        return this.__timerRunning__;
    },
    set: function (val) {
        // Is the timer currently running?
        if (!val && this.__timerRunning__) {
            this.__timerRunning__ = false;
            this.startStop_.label = "Start";
        }
        else if (val && !this.__timerRunning__) {
            this.__timerRunning__ = true;
            this.startStop_.label = "Stop";
        }
    }
});

TimerScreen.prototype.startStopTimer = function () {
    // Is the timer currently running?
    if (this.timerRunning) {
        // Then stop it:
        this.timerRunning = false;
        this.stopWatch_.stop();
    }
    else {
        // Otherwise start it:
        this.timerRunning = true;
        this.stopWatch_.start();
    }
    this.updateTimerDisplay();
}

TimerScreen.prototype.restartTimer = function () {
    this.timerRunning = true;
    this.stopWatch_.restart();
    this.updateTimerDisplay();
}

TimerScreen.prototype.resetTimer = function () {
    this.timerRunning = false;
    this.stopWatch_.reset();
    this.startValue_ = 0;
    this.updateTimerDisplay();
}

////////////////////////////////////////////////////////////////////////////////
///  @brief  
///    The underlying variable has changed.  Figure out what is different and
///    update the display.
///
///  @param [in] <from> <pointer to the object that is sending the update>
///
///  @param [in] <int> <not used here>
///
////////////////////////////////////////////////////////////////////////////////
TimerScreen.prototype.update = function (from) {
    // Make sure that the notification is from our variable
    if (from == this.var_) {
        // skip if timer not active 
        if (this.timerActive == true)
            this.UpdateTimerDisplay();
    }
}

////////////////////////////////////////////////////////////////////////////////
///  @brief
///    Called to update display with latest timer value when hardware timer value changed
///
////////////////////////////////////////////////////////////////////////////////
TimerScreen.prototype.updateTimerDisplay = function () {
    // Is the user inputing a value?
    if (this.dirty_) {
        this.timerValue_.setDisplayFromText(this.userInput_);
    }
    else {//if (this.timerRunning_) {
        //if (this.countDown_) {
        var temp = this.getStopWatchElapsedTime();
        if (this.startValue_ > 0) {
            this.timerValue_.setDisplayTime(this.startValue_ - temp);
        }
        else {
            this.timerValue_.setDisplayTime(temp);
        }
    }


    /*
    #define TIMER_STRING_SIZE 10 
    
      char time_string[TIMER_STRING_SIZE];
      value_t clock;
      uint16_t hours;
      uint32_t convertedInteger;
      Time t;
      bool negative;
    
      if (this.var_.hasNoValue())
        this.var_.setValue(0);
    
      //TODO: check max/min timer value - stop if at maximum value? roll over?
      if (this.countDown_ != 0)
        clock = this.startValue_ - this.var_.value();
      else
        clock = this.startValue_ + this.var_.value();
    
      if (clock < 0) {
        negative = true;
        clock = -clock;
      }
      else {
        negative = false;
      }
    
      // check for max timer value exceeded
      if (clock > MAX_TIMER_VALUE) {
        this.active_ = false;
        StopWatchStop();
        CancelWakeup();
    
        // reset timer start value
        this.startValue_ = this.countDown_;
        this.var_.setValue(0);
    
        // update start/stop text
        this.items_[TIMER_ITEM_START_STOP].ChangeText("Start");
    
        // display timer overflow
        this.items_[TIMER_ITEM_VALUE].ChangeRightText("99", true);
        this.items_[TIMER_ITEM_VALUE].ChangeText("99:", true);
        if (negative == true)
          this.items_[TIMER_ITEM_VALUE].ChangeLeftText("-99:", true);
        else
          this.items_[TIMER_ITEM_VALUE].ChangeLeftText("99:", true);
      }
      else {
        convertedInteger = (uint32_t)(clock);
    
        hours = (uint16_t)(convertedInteger/3600);
        convertedInteger = convertedInteger - (uint32_t)(3600*hours);
    
        t.minutes = (uint8_t)(convertedInteger/60);
        t.seconds = (uint8_t)(convertedInteger%60);
    
        if (hours > 99)
          hours = 99;
    
        t.hours = (uint8_t)(hours);
    
        // only update values that have changed
        if ((this.display_time_.hours != t.hours) || (this.display_minus_ != negative)) {
          if (negative == true)
            snprintf(time_string, TIMER_STRING_SIZE, "-%02u:", t.hours);
          else
            snprintf(time_string, TIMER_STRING_SIZE, "%02u:", t.hours);
          // update timer display
          this.items_[TIMER_ITEM_VALUE].ChangeLeftText(time_string, negative);
    
        }
        if ((this.display_time_.minutes != t.minutes) || (this.display_minus_ != negative)) {
          snprintf(time_string, TIMER_STRING_SIZE, "%02u:", t.minutes);
          // update timer display
          this.items_[TIMER_ITEM_VALUE].ChangeText(time_string, negative);
        }
        if ((this.display_time_.seconds != t.seconds) || (this.display_minus_ != negative)) {
          snprintf(time_string, TIMER_STRING_SIZE, "%02u", t.seconds);
          // update timer display
          this.items_[TIMER_ITEM_VALUE].ChangeRightText(time_string, negative);
        }
    
        // update display value
        this.display_time_.hours  = t.hours;
        this.display_time_.minutes = t.minutes;
        this.display_time_.seconds = t.seconds;
        this.display_minus_ = negative;
      }  
      */
}
